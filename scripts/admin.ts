import { PrismaClient, type Role } from "@prisma/client";

/**
 * Assigns and removes the PLATFORM_ADMIN role.
 *
 * This is deliberately the *only* way the role can be granted. There is no
 * self-service path, no "first user becomes admin" rule, no environment
 * variable that confers it and no admin screen for promoting people — every one
 * of those is a way for the role to be acquired by someone who talked their way
 * into it. Changing it requires shell access to the deployment, which is the
 * same bar as changing the code.
 *
 *   npm run admin -- someone@example.com          make them a platform admin
 *   npm run admin -- someone@example.com --revoke take it back
 *   npm run admin -- --list                       who currently has it
 *
 * Every grant and revoke is written to the admin audit log, attributed to
 * "cli:<whoever ran it>", so the trail starts at the very first admin.
 */

const prisma = new PrismaClient();

const USAGE = `
Usage:
  npm run admin -- <email>            grant PLATFORM_ADMIN
  npm run admin -- <email> --revoke   remove PLATFORM_ADMIN
  npm run admin -- --list             list current platform admins

Runs against DATABASE_URL. On Railway run it from the app service — the
Postgres container has no Node.
`.trim();

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const list = args.includes("--list");
  const emails = args
    .filter((arg) => !arg.startsWith("--"))
    .map((arg) => arg.trim().toLowerCase());

  if (list) return showAdmins();

  if (!emails.length) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const target: Role = revoke ? "USER" : "PLATFORM_ADMIN";
  let missing = 0;

  for (const email of emails) {
    const user = await findByEmail(email);

    if (!user) {
      console.log(`✗ ${email} — no account with that email`);
      missing += 1;
      continue;
    }

    if (user.role === target) {
      console.log(`· ${user.email} — already ${target}, left alone`);
      continue;
    }

    // Removing the last admin locks everyone out of /admin permanently, and the
    // only way back is this script again. Say so rather than silently doing it.
    if (revoke) {
      const remaining = await prisma.user.count({
        where: { role: "PLATFORM_ADMIN", id: { not: user.id } },
      });
      if (remaining === 0) {
        console.log(
          `✗ ${user.email} — that's the only platform admin. Grant the role to` +
            ` someone else first, or nobody can reach /admin.`,
        );
        process.exitCode = 1;
        continue;
      }
    }

    await prisma.user.update({ where: { id: user.id }, data: { role: target } });

    await prisma.adminAuditLog.create({
      data: {
        adminId: null,
        adminEmail: `cli:${process.env.USER ?? process.env.USERNAME ?? "unknown"}`,
        action: "ROLE_CHANGED",
        targetUserId: user.id,
        targetUserEmail: user.email,
        beforeState: `role=${user.role}`,
        afterState: `role=${target}`,
        note: "Set from the command line",
      },
    });

    console.log(
      revoke
        ? `✓ ${user.email} — platform admin removed`
        : `✓ ${user.email} — is now a platform admin`,
    );
  }

  if (missing) {
    console.log(
      `\n${missing} address${missing === 1 ? "" : "es"} had no account. Sign up in` +
        ` the app first, then run this again.`,
    );
    process.exitCode = 1;
  }
}

/** Signup lowercases addresses; the fallback covers anything created before that. */
async function findByEmail(email: string) {
  const exact = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });
  if (exact) return exact;

  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true, role: true },
  });
}

async function showAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: "PLATFORM_ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { email: true, displayName: true, createdAt: true, disabledAt: true },
  });

  if (!admins.length) {
    console.log("No platform admins. /admin returns 404 for everyone.");
    return;
  }

  console.log(`${admins.length} platform admin${admins.length === 1 ? "" : "s"}:`);
  for (const admin of admins) {
    const flag = admin.disabledAt ? "  [DISABLED]" : "";
    console.log(`  ${admin.email}  (${admin.displayName})${flag}`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
