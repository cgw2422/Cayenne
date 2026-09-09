import { SubHeader } from "../_SubHeader";
import { GoalPicker } from "@/components/GoalPicker";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { updateGoals } from "../settings/actions";

export const metadata = { title: "Personal goals" };
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();

  const [goals, mine] = await Promise.all([
    prisma.goal.findMany({ where: { isSystem: true }, orderBy: { sortOrder: "asc" } }),
    prisma.userGoal.findMany({ where: { userId: user.id }, include: { goal: true } }),
  ]);

  return (
    <>
      <SubHeader title="Personal goals" />
      <div className="px-5 pb-8">
        <p className="mb-4 text-[15px] leading-relaxed text-charcoal-500">
          These are the reasons you&apos;re here, in your words. Cayenne Do It tracks
          what you log against them — it doesn&apos;t claim cayenne achieves them.
        </p>
        <GoalPicker
          goals={goals.map((g) => ({ slug: g.slug, label: g.label, icon: g.icon }))}
          selected={mine.map((m) => m.goal.slug)}
          onSave={updateGoals}
        />
      </div>
    </>
  );
}
