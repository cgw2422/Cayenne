import "server-only";

import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import bcrypt from "bcryptjs";
import type { Entitlement, Profile, User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "cdi_session";
const SESSION_DAYS = 60;
const BCRYPT_ROUNDS = 12;

export type SessionUser = User & { profile: Profile | null };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sessions are opaque random tokens; only their SHA-256 is stored, so a database
 * leak does not hand out live sessions. The cookie is httpOnly + sameSite=lax.
 */
export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      userAgent: userAgent?.slice(0, 250) ?? null,
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

/** How stale `lastSeenAt` may get before the read path pays for a write. */
const SEEN_INTERVAL_MS = 30 * 60_000;

/** Cached per request so a page and its components share one lookup. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { profile: true } } },
  });

  if (!session || session.expiresAt < new Date()) return null;

  // A disabled account resolves to nobody, so an admin disabling someone takes
  // effect on their next request rather than at their next sign-in.
  if (session.user.disabledAt) return null;

  touch(session.user);
  return session.user;
});

/**
 * Records that the account is in use, for the admin "active users" figures.
 *
 * Deliberately fire-and-forget and guarded in the WHERE clause: it is one
 * statement that matches nothing at all for the next half hour, and a failure
 * must never break the request that triggered it.
 */
function touch(user: SessionUser) {
  const stale =
    !user.lastSeenAt || Date.now() - user.lastSeenAt.getTime() > SEEN_INTERVAL_MS;
  if (!stale) return;

  const cutoff = new Date(Date.now() - SEEN_INTERVAL_MS);
  void prisma.user
    .updateMany({
      where: { id: user.id, OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }] },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => undefined);
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "AuthRequiredError";
  }
}

/** Server-side authorization gate. Every mutation calls this — never trust the client. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthRequiredError();
  return user;
}

export function hasLifetime(entitlement: Entitlement): boolean {
  return entitlement === "LIFETIME";
}

/** Ends every live session for an account. Used when disabling or forcing a reset. */
export async function revokeAllSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
}
