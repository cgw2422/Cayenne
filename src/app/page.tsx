import { redirect } from "next/navigation";

import { ButtonLink } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { Flame } from "@/components/ui/Flame";
import { BRAND } from "@/lib/brand";
import { getSessionUser } from "@/server/auth";

const PROMISES = [
  { icon: "🔥", title: "Track your progress", body: "Log in about ten seconds a day." },
  { icon: "📊", title: "See real trends", body: "Streaks, calendars and honest charts." },
  { icon: "🎯", title: "Reach your goals", body: "The ones you set, in your own words." },
  { icon: "🏆", title: "Build a hot streak", body: "Badges worth the screenshot." },
];

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect(user.onboardedAt ? "/home" : "/welcome");

  return (
    <main className="mx-auto w-full max-w-lg px-6 pb-16 pt-12">
      <div className="flex flex-col items-center text-center">
        <Mascot size={132} className="animate-pop" />
        <h1 className="mt-4 text-[42px] font-extrabold leading-[0.95] tracking-tight text-charcoal-900">
          Cayenne
          <span className="block text-fire-gradient">Do It</span>
        </h1>
        <p className="mt-3 text-[15px] font-extrabold uppercase tracking-[0.22em] text-charcoal-500">
          {BRAND.tagline}
        </p>
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-charcoal-700">
          A healthier, happier you is totally Cayenne Do It. Build the habit, keep the
          streak, and share the kind of progress card people actually ask about.
        </p>
      </div>

      <ul className="mt-9 grid gap-3">
        {PROMISES.map((p) => (
          <li key={p.title} className="card flex items-center gap-4 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-100 text-xl">
              {p.icon}
            </span>
            <div>
              <p className="font-extrabold text-charcoal-900">{p.title}</p>
              <p className="text-sm text-charcoal-500">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-9 flex flex-col gap-3">
        <ButtonLink href="/sign-up" size="lg" full>
          <Flame size={20} /> Start my streak
        </ButtonLink>
        <ButtonLink href="/sign-in" variant="secondary" size="lg" full>
          I already have an account
        </ButtonLink>
      </div>

      <div className="mt-10 rounded-3xl bg-pepper-900 px-6 py-7 text-center text-cream-100">
        <p className="text-2xl font-extrabold">Same you.</p>
        <p className="text-2xl font-extrabold text-ember-400">A little hotter.</p>
        <p className="mt-3 text-sm leading-relaxed text-cream-200/80">
          Free to start. A one-time $5.99 unlock opens everything, forever. No
          subscription.
        </p>
      </div>

      <p className="mt-8 text-center text-xs leading-relaxed text-charcoal-500">
        Cayenne Do It is a personal habit-tracking and journaling app. It does not
        diagnose, treat, cure or prevent any condition, and nothing here is medical
        advice.
      </p>
    </main>
  );
}
