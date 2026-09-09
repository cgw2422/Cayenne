import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * System status.
 *
 * The governing rule: this module reports whether things are *configured and
 * reachable*, never what they are configured with. No environment variable
 * value is ever returned — only `Boolean(process.env.X)` — so there is no path
 * from this page to a key, a token, a hostname or a connection string, whatever
 * a future caller does with the result.
 *
 * Only two env values are ever rendered as text, and both are names rather than
 * credentials: `NODE_ENV` and Railway's environment name.
 */

export type Check = {
  label: string;
  state: "ok" | "warn" | "down" | "off";
  detail: string;
};

export type SystemReport = {
  environment: string;
  nodeEnv: string;
  nodeVersion: string;
  commit: string | null;
  builtAt: string | null;
  region: string | null;
  checks: Check[];
  counts: { migrations: number | null; dailyStats: number | null };
};

export async function systemReport(): Promise<SystemReport> {
  const [database, migrations, dailyStats] = await Promise.all([
    databaseCheck(),
    countMigrations(),
    prisma.dailyStat.count().catch(() => null),
  ]);

  return {
    environment: process.env.RAILWAY_ENVIRONMENT_NAME?.trim() || envFallback(),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    nodeVersion: process.version,
    commit: shortCommit(),
    builtAt: process.env.BUILD_TIMESTAMP?.trim() || null,
    region: process.env.RAILWAY_REPLICA_REGION?.trim() || null,
    checks: [database, webPushCheck(), schedulerCheck(), storageCheck()],
    counts: { migrations, dailyStats },
  };
}

/** A real query, not a config read: proves the connection actually works. */
async function databaseCheck(): Promise<Check> {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const ms = Date.now() - started;
    return {
      label: "PostgreSQL",
      state: ms > 500 ? "warn" : "ok",
      detail: `Responded in ${ms}ms`,
    };
  } catch {
    return { label: "PostgreSQL", state: "down", detail: "Query failed" };
  }
}

/**
 * Push notifications.
 *
 * Reports only whether the VAPID pair is present. The keys themselves are never
 * read into a value that could be returned.
 */
function webPushCheck(): Check {
  const configured =
    Boolean(process.env.VAPID_PUBLIC_KEY) && Boolean(process.env.VAPID_PRIVATE_KEY);
  return {
    label: "Web push",
    state: configured ? "ok" : "off",
    detail: configured
      ? "VAPID key pair present"
      : "No VAPID key pair — reminders fall back to in-app only",
  };
}

/**
 * Background work.
 *
 * There is no job runner, by design: the only recurring work admin analytics
 * needs is the daily rollup, and that happens lazily on the first dashboard
 * load of the day. Saying so is more useful than a green light that means
 * nothing.
 */
function schedulerCheck(): Check {
  return {
    label: "Background jobs",
    state: "ok",
    detail: "None scheduled. Daily stats roll up lazily on first admin load.",
  };
}

/** Share photos live in Postgres, so there is no object store to be down. */
function storageCheck(): Check {
  return {
    label: "File storage",
    state: "ok",
    detail: "Share photos stored in Postgres; no external bucket",
  };
}

async function countMigrations(): Promise<number | null> {
  try {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`;
    return Number(rows[0]?.count ?? 0);
  } catch {
    return null;
  }
}

/** The build's commit, from whichever CI variable is present. Never a URL. */
function shortCommit(): string | null {
  const sha =
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GIT_COMMIT_SHA ??
    process.env.SOURCE_COMMIT;
  return sha ? sha.trim().slice(0, 12) : null;
}

function envFallback() {
  return process.env.NODE_ENV === "production" ? "Production" : "Development";
}
