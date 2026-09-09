import "server-only";

import { notFound } from "next/navigation";

import { getSessionUser, type SessionUser } from "@/server/auth";

/**
 * The single authorization gate for everything under /admin.
 *
 * Two rules, both deliberate:
 *
 * 1. Authorization is decided here, from `User.role` in the database, on every
 *    page, every server action and every route handler. Nothing is protected by
 *    not rendering a link. A layout guard alone is not enough either — in the
 *    App Router a page's data fetching runs alongside its layout, so a page that
 *    did not check for itself could still execute its queries.
 *
 * 2. A non-admin gets a 404, not a 403. There is no signal that /admin exists,
 *    no login prompt to probe, and a signed-out visitor sees exactly what a
 *    signed-in regular user sees.
 */
export type AdminUser = SessionUser & { role: "PLATFORM_ADMIN" };

export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await getSessionUser();
  if (!user || user.role !== "PLATFORM_ADMIN") return null;
  return user as AdminUser;
}

/** For pages and layouts: renders the 404 for anyone who is not an admin. */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) notFound();
  return admin;
}

/**
 * Raised by `requireAdmin` in server actions and route handlers, where
 * `notFound()` is not the right control flow. Callers surface it as a 404.
 */
export class AdminRequiredError extends Error {
  constructor() {
    super("Not found");
    this.name = "AdminRequiredError";
  }
}

/**
 * For server actions and API routes. Throws rather than rendering, so an action
 * invoked directly — the client component is not the only way to reach one —
 * fails closed.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new AdminRequiredError();
  return admin;
}
