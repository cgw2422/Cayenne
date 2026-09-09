/**
 * Resolves the app's public origin.
 *
 * `NEXT_PUBLIC_APP_URL` is inlined at build time, which is awkward on hosts that
 * only tell you your domain *after* the first deploy. So a runtime `APP_URL`
 * wins, then the platform-provided domain (Railway sets `RAILWAY_PUBLIC_DOMAIN`),
 * then the build-time value, then localhost for development.
 */
export function siteUrl(): string {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) return `https://${stripTrailingSlash(railway)}`;

  const buildTime = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (buildTime) return stripTrailingSlash(buildTime);

  return "http://localhost:3000";
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
