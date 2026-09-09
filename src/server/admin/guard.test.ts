import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * Structural authorization tests.
 *
 * These do not exercise a running server — the Playwright suite does that, with
 * a real signed-in regular user hitting every admin URL. What these prove is
 * the property that browser test can only sample: that *every* admin page,
 * server action and route file checks authorization for itself, so a new one
 * cannot be added later without a guard and still pass CI.
 *
 * The failure this is really guarding against is subtle: in the App Router a
 * page's data fetching runs alongside its layout rather than after it, so a
 * page relying on the layout's check could still run its queries before the 404
 * was decided. Every file gets its own gate.
 */

const ADMIN_APP = path.join(process.cwd(), "src", "app", "admin");
const ADMIN_SERVER = path.join(process.cwd(), "src", "server", "admin");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const adminFiles = walk(ADMIN_APP);

/** Source with comments removed, so prose about a field is not read as a use of it. */
function strip(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

test("every admin page guards itself, not just the layout", () => {
  const pages = adminFiles.filter((f) => path.basename(f) === "page.tsx");
  assert.ok(pages.length >= 8, `expected the full admin section, found ${pages.length} pages`);

  for (const page of pages) {
    const source = readFileSync(page, "utf8");
    assert.match(
      source,
      /requireAdminPage\(\)/,
      `${path.relative(process.cwd(), page)} does not call requireAdminPage()`,
    );
  }
});

test("the admin layout guards the whole section", () => {
  const source = readFileSync(path.join(ADMIN_APP, "layout.tsx"), "utf8");
  assert.match(source, /requireAdminPage\(\)/);
});

test("every exported admin server action checks authorization", () => {
  const actionFiles = adminFiles.filter((f) => path.basename(f) === "actions.ts");
  assert.ok(actionFiles.length >= 3, "expected admin action files");

  for (const file of actionFiles) {
    const source = readFileSync(file, "utf8");
    const relative = path.relative(process.cwd(), file);

    assert.match(source, /^"use server";/m, `${relative} is not a server module`);

    // Each exported action must call requireAdmin() in its own body. Counting
    // is the point: one guard at the top of the file would protect nothing.
    const exported = [...source.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
    const guards = [...source.matchAll(/await requireAdmin\(\)/g)].length;

    assert.ok(exported.length > 0, `${relative} exports no actions`);
    assert.ok(
      guards >= exported.length,
      `${relative}: ${exported.length} exported action(s) but only ${guards} requireAdmin() call(s)`,
    );
  }
});

test("admin actions never trust a role passed in by the caller", () => {
  for (const file of adminFiles.filter((f) => path.basename(f) === "actions.ts")) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /input\.(role|isAdmin|adminId)\b/,
      `${path.relative(process.cwd(), file)} reads an authorization claim from its input`,
    );
  }
});

test("a non-admin gets a 404, never a redirect that reveals /admin exists", () => {
  const guard = readFileSync(path.join(ADMIN_SERVER, "guard.ts"), "utf8");
  assert.match(guard, /notFound\(\)/, "requireAdminPage must render the 404");
  assert.doesNotMatch(
    guard,
    /redirect\(/,
    "redirecting from /admin tells an attacker the section exists",
  );
  // The role comparison itself: only this exact value passes.
  assert.match(guard, /role !== "PLATFORM_ADMIN"/);
});

test("the role is only ever granted from the command line", () => {
  const sources = [
    ...walk(path.join(process.cwd(), "src")),
    ...walk(path.join(process.cwd(), "scripts")),
  ].filter((f) => /\.(ts|tsx)$/.test(f));

  // A file only counts as a writer if it both names the role and writes to the
  // user table — a type annotation mentioning PLATFORM_ADMIN grants nothing.
  const writers = sources.filter((file) => {
    const source = strip(readFileSync(file, "utf8"));
    const assigns = /role:\s*(target|"PLATFORM_ADMIN"|'PLATFORM_ADMIN')/.test(source);
    const writes = /prisma\.user\.(update|updateMany|create|upsert)/.test(source);
    return assigns && writes;
  });

  assert.deepEqual(
    writers.map((f) => path.relative(process.cwd(), f)),
    ["scripts/admin.ts"],
    "PLATFORM_ADMIN must only be assignable from scripts/admin.ts",
  );
});

test("the system page never renders an environment variable's value", () => {
  const source = readFileSync(path.join(ADMIN_SERVER, "system.ts"), "utf8");

  // Only these two env vars may be read as text, and both are names rather
  // than credentials. Everything else must be coerced to a boolean.
  const reads = [...source.matchAll(/process\.env\.([A-Z_0-9]+)/g)].map((m) => m[1]);
  const allowedAsText = new Set([
    "NODE_ENV",
    "RAILWAY_ENVIRONMENT_NAME",
    "RAILWAY_REPLICA_REGION",
    "BUILD_TIMESTAMP",
    "RAILWAY_GIT_COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "GIT_COMMIT_SHA",
    "SOURCE_COMMIT",
  ]);

  for (const name of reads) {
    if (allowedAsText.has(name)) continue;
    const pattern = new RegExp(`Boolean\\(process\\.env\\.${name}\\)`);
    assert.match(
      source,
      pattern,
      `system.ts reads ${name} without wrapping it in Boolean() — its value could reach the page`,
    );
  }

  assert.doesNotMatch(source, /DATABASE_URL/, "never touch the connection string here");
});

test("the admin user queries never read private health data", () => {
  // Comments are stripped first: the file *documents* what it refuses to read,
  // and a check that cannot tell prose from a select is not checking anything.
  const source = strip(readFileSync(path.join(ADMIN_SERVER, "users.ts"), "utf8"));

  for (const forbidden of [
    "measurements",
    "journal",
    "sharePhotos",
    "weight",
    "glucose",
    "systolic",
    "passwordHash",
  ]) {
    assert.doesNotMatch(
      source,
      new RegExp(`\\b${forbidden}\\b`, "i"),
      `admin user queries must not select ${forbidden}`,
    );
  }
});
