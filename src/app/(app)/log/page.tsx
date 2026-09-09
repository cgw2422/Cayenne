import Link from "next/link";

import { LogForm } from "@/components/LogForm";
import { Card, SectionTitle } from "@/components/ui/primitives";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { formatAmount, METHOD_META, MOOD_META } from "@/lib/brand";
import { dateColumnFromDayKey, todayInZone } from "@/lib/date";
import { saveEntry } from "./actions";

export const metadata = { title: "Log cayenne" };

export default async function LogPage() {
  const user = await requireUser();
  const today = todayInZone(user.profile?.timezone ?? "UTC");

  const [userGoals, todays] = await Promise.all([
    prisma.userGoal.findMany({
      where: { userId: user.id },
      include: { goal: true },
      orderBy: { goal: { sortOrder: "asc" } },
    }),
    prisma.cayenneEntry.findMany({
      where: { userId: user.id, takenOn: dateColumnFromDayKey(today) },
      orderBy: { takenAt: "desc" },
    }),
  ]);

  return (
    <>
      <header className="flex items-center gap-3 px-5 pb-4 pt-5">
        <Link
          href="/home"
          aria-label="Back to home"
          className="tap grid place-items-center rounded-full text-charcoal-700"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m14.5 5-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-xl font-extrabold text-charcoal-900">Log Cayenne</h1>
      </header>

      <LogForm
        goals={userGoals.map((ug) => ({
          id: ug.id,
          label: ug.goal.label,
          icon: ug.goal.icon,
        }))}
        defaults={{
          method: user.profile?.defaultMethod ?? null,
          amount: user.profile?.defaultAmount ? Number(user.profile.defaultAmount) : null,
          unit: user.profile?.defaultUnit ?? "TSP",
        }}
        onSave={saveEntry}
      />

      {todays.length ? (
        <section className="px-5 pb-6">
          <SectionTitle>Already logged today</SectionTitle>
          <ul className="grid gap-2">
            {todays.map((entry) => (
              <Card as="li" key={entry.id} className="flex items-center gap-3 py-3.5">
                <span className="text-xl">{METHOD_META[entry.method].icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-charcoal-900">
                    {formatAmount(Number(entry.amount), entry.unit)}{" "}
                    <span className="font-bold text-charcoal-500">
                      · {METHOD_META[entry.method].label}
                    </span>
                  </p>
                  <p className="text-xs text-charcoal-500">
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(entry.takenAt)}
                    {entry.mood
                      ? ` · ${MOOD_META.find((m) => m.value === entry.mood)?.label}`
                      : ""}
                  </p>
                </div>
                <Link
                  href={`/log/${entry.id}`}
                  className="text-sm font-extrabold text-cayenne-600 underline underline-offset-2"
                >
                  Edit
                </Link>
              </Card>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
