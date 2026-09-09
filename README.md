# Cayenne Do It

**Small habit. Big fire.**

A mobile-first PWA for building a consistent cayenne habit: log in about ten
seconds, keep a streak, watch honest trends, and generate a share card worth
posting.

> Cayenne Do It is a habit-tracking and journaling app. It does not provide
> medical advice, diagnosis or treatment, and it never claims cayenne treats,
> prevents or cures anything. Goals, measurements and journal entries are the
> user's own records; the app does not attribute changes in them to cayenne.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, React 19, server actions) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, brand tokens in `src/app/globals.css` |
| Database | PostgreSQL via Prisma 6 |
| Auth | Opaque session cookies, bcrypt, SHA-256 token storage |
| Images | `next/og` for share cards and app icons |
| PWA | Hand-rolled service worker + generated manifest |

No UI kit, no chart library — the mascot, streak ring, charts and calendar are
purpose-built SVG so the app looks like itself rather than a template.

## Getting started

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate deploy     # or: npx prisma migrate dev
npm run db:seed               # goals, challenges, badges, 80 quotes, 15 recipes
npm run dev
```

Generate a real secret with `openssl rand -base64 48`.

### Scripts

| Script | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build and server |
| `npm test` | Streak-logic unit tests (`node:test`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` / `db:push` / `db:seed` / `db:studio` | Prisma |

## Architecture

```
src/
  app/
    (auth)/        sign-in, sign-up, auth server actions
    welcome/       six-screen onboarding
    (app)/         authenticated shell + bottom nav
      home/        dashboard: streak ring, pep talk, challenge
      log/         the ten-second entry form
      progress/    overview · stats · calendar
      recipes/     library, detail, custom recipes
      more/        achievements, challenges, journal, measurements,
                   goals, settings, privacy, unlock, about
      share/       share-card studio
    s/[token]/     public share landing page (Open Graph)
    api/           share image (PNG), data export
  components/      UI, charts, mascot, forms
  lib/             dates, streak maths, brand, entitlements, validation
  server/          auth, habit domain, quotes, progress, share (server-only)
prisma/            schema, migrations, seed
```

### Key decisions

**Streaks are computed from the set of logged days** (`src/lib/streak.ts`), then
cached on `Profile` for fast reads. Today counts as a grace period: a streak only
breaks once a full day has passed with no entry. All 13 edge cases — month
boundaries, leap days, duplicate entries, gaps — are covered by `npm test`.

**Every mutation re-derives its own facts server-side.** A tampered client can't
inflate a streak or attach another user's goals to an entry; `requireUser()`
gates every action and posted ids are re-checked against ownership.

**Entitlements route through one function.** `can(entitlement, feature)` in
`src/lib/entitlements.ts` is the only gate in the app. Payment providers set
`User.entitlement` and nothing else — Stripe today and Apple/Google IAP later
land on the same field, so no provider logic leaks into feature code. The
current unlock button is a stand-in for checkout.

**Share cards can't leak private data by construction.** A `ShareCard` row stores
only a headline, subline, streak count, day total, an optional quote and an
optional goal *label*. Journal entries, notes, moods and measurements are not
reachable from the renderer, so there is no setting or bug that can put them on a
card. Cards render as PNGs via `next/og` at both 1080×1080 (feed post) and
1200×630 (link preview), with the public `/s/[token]` page carrying the OG tags.

**The quote engine remembers.** One quote per user per day is recorded in
`QuoteImpression`, and selection avoids the last 45 days before falling back to
the full pool — so refreshing the dashboard doesn't reshuffle the copy and the
same line doesn't recur for months. Seeded with 80 original lines across six
categories.

**Auth stores hashes, not tokens.** Sessions are 32 random bytes in an httpOnly,
sameSite=lax cookie; only the SHA-256 is persisted, so a database leak hands out
nothing usable. An `Account` table is present from day one so Google/Apple sign-in
is a row insert rather than a migration.

### Data model

Fifteen related tables with real columns, foreign keys and indexes — no JSON
blobs:

- **Identity** — `User`, `Account`, `Session`, `Profile`
- **Habit** — `CayenneEntry`, `EntryGoal`, `Goal`, `UserGoal`
- **Private tracking** — `Measurement`, `JournalEntry`
- **Motivation** — `Quote`, `QuoteImpression`, `Achievement`,
  `UserAchievement`, `Challenge`, `UserChallenge`
- **Content** — `Recipe`, `RecipeIngredient`, `RecipeStep`, `RecipeFavorite`
- **Plumbing** — `NotificationPreference`, `PushSubscription`, `ShareCard`

Everything cascades from `User`, so account deletion is a single statement.

## Deploying to Railway

Railway builds this with Nixpacks; `railway.json` pins the build and start
commands. `npm start` runs `prisma migrate deploy` before booting, so schema
changes apply on every deploy.

1. **Create the project.** In Railway, *New Project → Deploy from GitHub repo*
   and pick this repository and branch.
2. **Add Postgres.** *New → Database → Add PostgreSQL* in the same project.
3. **Set variables** on the app service:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (a Railway reference) |
   | `AUTH_SECRET` | output of `openssl rand -base64 48` |
   | `NEXT_PUBLIC_APP_URL` | your public URL, once you have one |

   `APP_URL` is optional — Railway's `RAILWAY_PUBLIC_DOMAIN` is picked up
   automatically at runtime. `NEXT_PUBLIC_APP_URL` is baked at build time, so
   set it after generating a domain and redeploy once.
4. **Generate a domain.** *Settings → Networking → Generate Domain*. Railway
   injects `PORT`, which `next start` already honours.
5. **Seed the reference data — required.** Goals, quotes, badges, challenges and
   the recipe library live in the database, so the app is not usable until this
   runs. Once, from a local checkout:

   ```bash
   npm install
   npx @railway/cli login
   npx @railway/cli link          # select the project and the app service
   npx @railway/cli run npm run db:seed
   ```

   The seed is idempotent (every write is an upsert), so re-running it after a
   content change is safe.

Then open the domain and create an account. The lifetime-unlock button is a
stand-in for checkout and is disabled in production unless `ALLOW_DEV_UNLOCK` is
set — leave it unset for a real launch.

## Privacy

Nothing is public by default and there is no social feed. Sharing is opt-in per
card. Health-adjacent data (weight, waist, blood pressure, glucose, journal,
notes) is excluded from share cards structurally, and the full account exports as
JSON from `/api/export`.

## Not built yet

- **Payments.** The entitlement system is complete; checkout is a stand-in
  button. Wire Stripe (or IAP) to set `User.entitlement = LIFETIME`.
- **Push delivery.** `PushSubscription` and the service worker's `push` handler
  are in place; sending needs VAPID keys and a scheduler.
- **Community feed.** Deliberately out of scope — the share cards do that job.
