import { SubHeader } from "../_SubHeader";
import { ChallengeCard } from "@/components/ChallengeCard";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { can, FEATURES } from "@/lib/entitlements";
import { dayKeyFromDateColumn, diffDays } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { userToday } from "@/server/habit";
import { joinChallenge, leaveChallenge } from "./actions";

export const metadata = { title: "Challenges" };
export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const user = await requireUser();
  const today = userToday(user);
  const unlocked = can(user.entitlement, FEATURES.ALL_CHALLENGES);

  const [challenges, mine] = await Promise.all([
    prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.userChallenge.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeByChallenge = new Map(
    mine.filter((m) => m.status === "ACTIVE").map((m) => [m.challengeId, m]),
  );
  const completed = new Set(
    mine.filter((m) => m.status === "COMPLETED").map((m) => m.challengeId),
  );

  // One query covers progress for every active challenge.
  const earliest = [...activeByChallenge.values()].reduce<Date | null>(
    (min, uc) => (!min || uc.startedOn < min ? uc.startedOn : min),
    null,
  );
  const loggedDays = earliest
    ? await prisma.cayenneEntry
        .findMany({
          where: { userId: user.id, takenOn: { gte: earliest } },
          distinct: ["takenOn"],
          select: { takenOn: true },
        })
        .then((rows) => rows.map((r) => dayKeyFromDateColumn(r.takenOn)))
    : [];

  return (
    <>
      <SubHeader title="Challenges" />

      <div className="flex flex-col gap-4 px-5 pb-8">
        <p className="text-[15px] leading-relaxed text-charcoal-500">
          A challenge gives your streak a finish line. Miss a day and you keep going —
          the count is days logged, not perfection.
        </p>

        {challenges.map((challenge) => {
          const active = activeByChallenge.get(challenge.id);
          const startKey = active ? dayKeyFromDateColumn(active.startedOn) : null;
          const done = startKey
            ? loggedDays.filter((d) => d >= startKey).length
            : 0;
          const elapsed = startKey ? diffDays(startKey, today) + 1 : 0;

          return (
            <ChallengeCard
              key={challenge.id}
              challenge={{
                id: challenge.id,
                title: challenge.title,
                description: challenge.description,
                durationDays: challenge.durationDays,
                locked: challenge.isPremium && !unlocked,
              }}
              active={
                active
                  ? {
                      id: active.id,
                      done: Math.min(done, challenge.durationDays),
                      elapsed,
                      left: Math.max(0, challenge.durationDays - elapsed + 1),
                    }
                  : null
              }
              completed={completed.has(challenge.id)}
              onJoin={joinChallenge}
              onLeave={leaveChallenge}
            />
          );
        })}

        {!unlocked ? <UpgradeNudge feature={FEATURES.ALL_CHALLENGES} /> : null}
      </div>
    </>
  );
}
