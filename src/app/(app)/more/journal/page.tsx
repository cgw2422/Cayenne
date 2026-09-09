import { SubHeader } from "../_SubHeader";
import { JournalComposer } from "@/components/JournalComposer";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { Card, EmptyState } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { MOOD_META } from "@/lib/brand";
import { can, FEATURES } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { deleteJournalEntry, saveJournalEntry } from "./actions";

export const metadata = { title: "Journal" };
export const dynamic = "force-dynamic";

const PROMPTS = [
  "What have you noticed lately?",
  "How is your routine going?",
  "What would you tell yourself on Day 1?",
  "What made today easy, or hard?",
  "What's worth keeping about this week?",
];

export default async function JournalPage() {
  const user = await requireUser();
  const unlocked = can(user.entitlement, FEATURES.JOURNAL);

  const entries = unlocked
    ? await prisma.journalEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  // Rotates daily without needing storage.
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <>
      <SubHeader title="Journal" />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {unlocked ? (
          <>
            <JournalComposer
              prompt={prompt}
              onSave={saveJournalEntry}
              onDelete={deleteJournalEntry}
            />

            {entries.length === 0 ? (
              <EmptyState
                mascot={<Mascot pose="rest" size={80} />}
                title="Nothing written yet"
                body="A line or two is plenty. Future you will be glad there's a record of how this actually went."
              />
            ) : (
              <ul className="grid gap-3">
                {entries.map((entry) => (
                  <Card as="li" key={entry.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <time
                        dateTime={entry.createdAt.toISOString()}
                        className="text-xs font-extrabold uppercase tracking-wider text-charcoal-500"
                      >
                        {new Intl.DateTimeFormat("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }).format(entry.createdAt)}
                      </time>
                      {entry.mood ? (
                        <span className="text-lg" title={String(entry.mood)}>
                          {MOOD_META.find((m) => m.value === entry.mood)?.icon}
                        </span>
                      ) : null}
                    </div>
                    {entry.prompt ? (
                      <p className="mb-1 text-xs font-bold text-cayenne-600">
                        {entry.prompt}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal-900">
                      {entry.body}
                    </p>
                  </Card>
                ))}
              </ul>
            )}

            <p className="text-xs leading-relaxed text-charcoal-500">
              Your journal is private. It is never included on a share card and never
              shown to anyone else.
            </p>
          </>
        ) : (
          <UpgradeNudge feature={FEATURES.JOURNAL} />
        )}
      </div>
    </>
  );
}
