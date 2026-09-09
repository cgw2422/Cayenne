import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * The admin user list and detail queries.
 *
 * Deliberately narrow selects. Weight, blood pressure, glucose, body
 * measurements, journal entries and share photos are never read here — not
 * filtered out in the template, not fetched and dropped, simply never asked
 * for. Should an operational need for any of that ever arise, it belongs in a
 * separately gated feature with its own audit trail, not on this screen.
 */

export const SORTS = ["signup", "active", "logs", "streak"] as const;
export type SortId = (typeof SORTS)[number];

export const SORT_LABEL: Record<SortId, string> = {
  signup: "Newest signup",
  active: "Last active",
  logs: "Most days logged",
  streak: "Longest current streak",
};

/** How recently an account must have been used to count as active. */
export const ACTIVE_WINDOW_DAYS = 30;

export const PAGE_SIZE = 25;

export type UserFilters = {
  q: string;
  entitlement: "all" | "FREE" | "LIFETIME";
  activity: "all" | "active" | "inactive";
  sort: SortId;
  page: number;
};

export function parseFilters(params: Record<string, string | undefined>): UserFilters {
  const page = Number.parseInt(params.page ?? "1", 10);
  return {
    q: (params.q ?? "").trim().slice(0, 120),
    entitlement:
      params.entitlement === "FREE" || params.entitlement === "LIFETIME"
        ? params.entitlement
        : "all",
    activity:
      params.activity === "active" || params.activity === "inactive"
        ? params.activity
        : "all",
    sort: (SORTS as readonly string[]).includes(params.sort ?? "")
      ? (params.sort as SortId)
      : "signup",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function whereFrom(filters: UserFilters): Prisma.UserWhereInput {
  const cutoff = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);
  const clauses: Prisma.UserWhereInput[] = [];

  if (filters.q) {
    clauses.push({
      OR: [
        { email: { contains: filters.q, mode: "insensitive" } },
        { displayName: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }
  if (filters.entitlement !== "all") clauses.push({ entitlement: filters.entitlement });
  if (filters.activity === "active") clauses.push({ lastSeenAt: { gte: cutoff } });
  if (filters.activity === "inactive") {
    // Never seen counts as inactive, which a plain `lt` would silently drop.
    clauses.push({ OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }] });
  }

  return clauses.length ? { AND: clauses } : {};
}

function orderFrom(sort: SortId): Prisma.UserOrderByWithRelationInput[] {
  switch (sort) {
    case "active":
      // Nulls last: an account that has never been seen is not "most recent".
      return [{ lastSeenAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "logs":
      return [{ profile: { totalDays: "desc" } }, { createdAt: "desc" }];
    case "streak":
      return [{ profile: { currentStreak: "desc" } }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export type UserRow = Awaited<ReturnType<typeof listUsers>>["rows"][number];

export async function listUsers(filters: UserFilters) {
  const where = whereFrom(filters);

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: orderFrom(filters.sort),
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
        lastSeenAt: true,
        entitlement: true,
        entitlementSource: true,
        disabledAt: true,
        role: true,
        profile: {
          select: { totalDays: true, currentStreak: true, longestStreak: true },
        },
        // Filtered relation counts, so a page of 25 stays one round trip
        // instead of 50 follow-up queries.
        _count: {
          select: {
            challenges: { where: { status: "COMPLETED" } },
            shareCards: true,
          },
        },
      },
    }),
  ]);

  return { rows, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export type AdminUserDetail = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>;

export async function getUserDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      displayName: true,
      email: true,
      createdAt: true,
      lastSeenAt: true,
      onboardedAt: true,
      disabledAt: true,
      passwordResetAt: true,
      role: true,
      entitlement: true,
      entitledAt: true,
      entitlementSource: true,
      entitlementProvider: true,
      entitlementNote: true,
      profile: {
        select: {
          currentStreak: true,
          longestStreak: true,
          totalDays: true,
          lastLoggedOn: true,
          startedOn: true,
          timezone: true,
          dosesPerDay: true,
        },
      },
      challenges: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          startedOn: true,
          completedAt: true,
          challenge: { select: { title: true, durationDays: true } },
        },
      },
      achievements: {
        orderBy: { unlockedAt: "desc" },
        select: {
          id: true,
          unlockedAt: true,
          achievement: { select: { title: true, tier: true } },
        },
      },
      _count: {
        select: {
          shareCards: true,
          entries: true,
          recipes: true,
          feedback: true,
        },
      },
    },
  });

  return user;
}

/** The audit trail for one account, newest first. */
export function auditForUser(userId: string, take = 25) {
  return prisma.adminAuditLog.findMany({
    where: { targetUserId: userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
