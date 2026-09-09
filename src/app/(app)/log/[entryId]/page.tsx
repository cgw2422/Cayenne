import Link from "next/link";
import { notFound } from "next/navigation";

import { LogForm } from "@/components/LogForm";
import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { deleteEntry, saveEntry } from "../actions";

export const metadata = { title: "Edit entry" };

function localInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export default async function EditEntryPage({
  params,
}: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await params;
  const user = await requireUser();

  const [entry, userGoals] = await Promise.all([
    prisma.cayenneEntry.findFirst({
      where: { id: entryId, userId: user.id },
      include: { goals: true },
    }),
    prisma.userGoal.findMany({
      where: { userId: user.id },
      include: { goal: true },
      orderBy: { goal: { sortOrder: "asc" } },
    }),
  ]);

  if (!entry) notFound();

  return (
    <>
      <header className="flex items-center gap-3 px-5 pb-4 pt-5">
        <Link
          href="/log"
          aria-label="Back"
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
        <h1 className="text-xl font-extrabold text-charcoal-900">Edit entry</h1>
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
        entry={{
          id: entry.id,
          takenAt: localInputValue(entry.takenAt),
          method: entry.method,
          amount: Number(entry.amount),
          unit: entry.unit,
          mood: entry.mood,
          notes: entry.notes,
          goalIds: entry.goals.map((g) => g.userGoalId),
        }}
        onSave={saveEntry}
      />

      <div className="px-5 pb-8">
        <DeleteEntryButton entryId={entry.id} onDelete={deleteEntry} />
      </div>
    </>
  );
}
