import { PrismaClient, type Entitlement } from "@prisma/client";

/**
 * Grants or revokes lifetime access by email.
 *
 * The entitlement is one column, checked in one place (`can()` in
 * src/lib/entitlements.ts), so this script is the whole admin surface: no
 * payment provider is involved and nothing else needs to change. It exists so
 * comping someone — a giveaway, a refund, a friend — is a command with a
 * confirmation rather than hand-typed SQL against production.
 *
 *   npm run grant -- someone@example.com
 *   npm run grant -- a@example.com b@example.com
 *   npm run grant -- someone@example.com --revoke
 *   npm run grant -- --list
 *
 * Takes effect immediately: the app reads the entitlement from the user's row
 * on every request, so nobody has to sign out and back in.
 */

const prisma = new PrismaClient();

const USAGE = `
Usage:
  npm run grant -- <email> [<email>...]   grant lifetime
  npm run grant -- <email> --revoke       take it back
  npm run grant -- --list                 show every lifetime account

Runs against DATABASE_URL. On Railway, run it from the app service
(the Postgres container has no Node), or locally with the same
DATABASE_URL as production.
`.trim();

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const list = args.includes("--list");
  const emails = args
    .filter((arg) => !arg.startsWith("--"))
    .map((arg) => arg.trim().toLowerCase());

  if (list) return showLifetimeAccounts();

  if (!emails.length) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const target: Entitlement = revoke ? "FREE" : "LIFETIME";
  let missing = 0;

  for (const email of emails) {
    const user = await findByEmail(email);

    if (!user) {
      console.log(`✗ ${email} — no account with that email`);
      missing += 1;
      continue;
    }

    if (user.entitlement === target) {
      console.log(`· ${user.email} — already ${target.toLowerCase()}, left alone`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        entitlement: target,
        entitledAt: target === "LIFETIME" ? new Date() : null,
      },
    });
    console.log(
      revoke
        ? `✓ ${user.email} — lifetime removed`
        : `✓ ${user.email} — lifetime granted`,
    );
  }

  if (missing) {
    console.log(
      `\n${missing} address${missing === 1 ? "" : "es"} had no account. They have to` +
        ` sign up first — check for a typo, or ask which email they registered with.`,
    );
    process.exitCode = 1;
  }
}

/**
 * Signup lowercases every address, so an exact match is the normal path. The
 * insensitive fallback is for any account created before that was true.
 */
async function findByEmail(email: string) {
  const exact = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, entitlement: true },
  });
  if (exact) return exact;

  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, entitlement: true },
  });
}

async function showLifetimeAccounts() {
  const users = await prisma.user.findMany({
    where: { entitlement: "LIFETIME" },
    orderBy: { entitledAt: "desc" },
    select: { email: true, displayName: true, entitledAt: true },
  });

  if (!users.length) {
    console.log("No lifetime accounts yet.");
    return;
  }

  console.log(`${users.length} lifetime account${users.length === 1 ? "" : "s"}:`);
  for (const user of users) {
    const when = user.entitledAt ? user.entitledAt.toISOString().slice(0, 10) : "unknown";
    console.log(`  ${when}  ${user.email}  (${user.displayName})`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
