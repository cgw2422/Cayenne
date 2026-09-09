import Link from "next/link";

import { SignOutButton } from "@/components/SignOutButton";
import { InstallPrompt } from "@/components/InstallPrompt";
import { Card, SectionTitle } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { LIFETIME_PRICE_USD } from "@/lib/entitlements";
import { requireUser } from "@/server/auth";
import { streakFor } from "@/server/habit";
import { signOut } from "@/app/(auth)/actions";

export const metadata = { title: "More" };
export const dynamic = "force-dynamic";

const TRACK = [
  { href: "/more/achievements", icon: "🏆", label: "Achievements", hint: "Badges you've unlocked" },
  { href: "/more/challenges", icon: "🎯", label: "Challenges", hint: "Give the streak a finish line" },
  { href: "/more/journal", icon: "📓", label: "Journal", hint: "What you've noticed" },
  { href: "/more/measurements", icon: "📏", label: "Measurements", hint: "Private personal tracking" },
];

const SETTINGS = [
  { href: "/more/goals", icon: "🎯", label: "Personal goals" },
  { href: "/more/settings", icon: "⚙️", label: "Settings & reminders" },
  { href: "/more/privacy", icon: "🔒", label: "Privacy & your data" },
  { href: "/more/about", icon: "ℹ️", label: "About & disclaimer" },
];

export default async function MorePage() {
  const user = await requireUser();
  const summary = await streakFor(user);
  const lifetime = user.entitlement === "LIFETIME";

  return (
    <>
      <header className="px-5 pb-4 pt-6">
        <h1 className="text-2xl font-extrabold text-charcoal-900">More</h1>
      </header>

      <div className="flex flex-col gap-5 px-5 pb-6">
        <Card className="flex items-center gap-4">
          <Mascot size={58} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-charcoal-900">
              {user.displayName}
            </p>
            <p className="truncate text-sm text-charcoal-500">{user.email}</p>
            <p className="mt-1 text-xs font-bold text-cayenne-600">
              {summary.totalDays} days logged · {summary.longest} day best streak
            </p>
          </div>
        </Card>

        {!lifetime ? (
          <Link
            href="/more/unlock"
            className="block overflow-hidden rounded-[1.5rem] bg-pepper-900 p-5 text-cream-100 shadow-lift"
          >
            <p className="text-lg font-extrabold">Unlock everything</p>
            <p className="mt-1 text-sm leading-relaxed text-cream-200/80">
              One payment of ${LIFETIME_PRICE_USD.toFixed(2)}. No subscription, no
              renewals — yours for good.
            </p>
            <p className="mt-3 text-sm font-extrabold text-ember-400">See what&apos;s inside →</p>
          </Link>
        ) : (
          <div className="rounded-[1.5rem] border border-cream-300 bg-white p-4 text-center">
            <p className="font-extrabold text-charcoal-900">🔓 Lifetime unlocked</p>
            <p className="mt-0.5 text-sm text-charcoal-500">
              Everything&apos;s yours. Thanks for backing this.
            </p>
          </div>
        )}

        <section>
          <SectionTitle>Track</SectionTitle>
          <Card className="p-0">
            <ul>
              {TRACK.map((item, i) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="tap flex items-center gap-3.5 px-4 py-3.5"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cream-100 text-lg">
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold text-charcoal-900">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-charcoal-500">
                        {item.hint}
                      </span>
                    </span>
                    <Chevron />
                  </Link>
                  {i < TRACK.length - 1 ? (
                    <hr className="ml-[4.4rem] border-cream-200" />
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <SectionTitle>Account</SectionTitle>
          <Card className="p-0">
            <ul>
              {SETTINGS.map((item, i) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="tap flex items-center gap-3.5 px-4 py-3.5"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cream-100 text-lg">
                      {item.icon}
                    </span>
                    <span className="flex-1 font-extrabold text-charcoal-900">
                      {item.label}
                    </span>
                    <Chevron />
                  </Link>
                  {i < SETTINGS.length - 1 ? (
                    <hr className="ml-[4.4rem] border-cream-200" />
                  ) : null}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <InstallPrompt />

        <SignOutButton onSignOut={signOut} />

        <p className="pb-2 text-center text-xs leading-relaxed text-charcoal-500">
          Cayenne Do It · Small habit. Big fire.
          <br />
          Not medical advice.
        </p>
      </div>
    </>
  );
}

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-charcoal-500/50"
      aria-hidden="true"
    >
      <path
        d="m9.5 5 7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
