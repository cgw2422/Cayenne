import { SubHeader } from "../_SubHeader";
import { Card, cx } from "@/components/ui/primitives";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { evaluateAchievements, markAchievementsSeen, streakFor } from "@/server/habit";

export const metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

const TIER_EMOJI = ["🌱", "🔥", "🌶️", "🏆", "👑"];

export default async function AchievementsPage() {
  const user = await requireUser();
  const summary = await streakFor(user);

  // Catch up anything earned outside the log flow (e.g. saved recipes).
  await evaluateAchievements(user.id, summary);

  const [catalog, unlocked] = await Promise.all([
    prisma.achievement.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.userAchievement.findMany({ where: { userId: user.id } }),
  ]);

  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u]));
  await markAchievementsSeen(
    user.id,
    unlocked.filter((u) => !u.seenAt).map((u) => u.achievementId),
  );

  const earned = catalog.filter((a) => unlockedMap.has(a.id));

  return (
    <>
      <SubHeader title="Achievements" />

      <div className="flex flex-col gap-4 px-5 pb-8">
        <Card className="text-center">
          <p className="text-3xl font-extrabold text-charcoal-900">
            {earned.length}
            <span className="text-charcoal-500/60">/{catalog.length}</span>
          </p>
          <p className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
            Badges unlocked
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full rounded-full fire-gradient transition-all duration-700"
              style={{ width: `${(earned.length / catalog.length) * 100}%` }}
            />
          </div>
        </Card>

        <ul className="grid grid-cols-2 gap-3">
          {catalog.map((achievement) => {
            const got = unlockedMap.get(achievement.id);
            return (
              <li
                key={achievement.id}
                className={cx(
                  "flex flex-col items-center gap-1.5 rounded-[1.5rem] border p-4 text-center transition-all",
                  got
                    ? "border-cream-300 bg-white shadow-soft"
                    : "border-dashed border-cream-300 bg-cream-100/50",
                )}
              >
                <span
                  className={cx(
                    "grid size-14 place-items-center rounded-full text-2xl",
                    got ? "fire-gradient" : "bg-cream-200 grayscale",
                  )}
                >
                  {TIER_EMOJI[Math.min(achievement.tier - 1, TIER_EMOJI.length - 1)]}
                </span>
                <p
                  className={cx(
                    "text-sm font-extrabold",
                    got ? "text-charcoal-900" : "text-charcoal-500",
                  )}
                >
                  {achievement.title}
                </p>
                <p className="text-[11px] leading-snug text-charcoal-500">
                  {achievement.description}
                </p>
                {got ? (
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-cayenne-600">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      day: "numeric",
                    }).format(got.unlockedAt)}
                  </p>
                ) : (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500/60">
                    Locked
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
