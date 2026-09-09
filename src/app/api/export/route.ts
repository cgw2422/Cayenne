import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/server/auth";
import { can, FEATURES } from "@/lib/entitlements";

/** Exports everything the account holds, as JSON. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (!can(user.entitlement, FEATURES.DATA_EXPORT)) {
    return Response.json(
      { error: "Data export is part of the lifetime unlock." },
      { status: 402 },
    );
  }

  const [entries, goals, measurements, journal, challenges, achievements, recipes, favorites, prefs] =
    await Promise.all([
      prisma.cayenneEntry.findMany({
        where: { userId: user.id },
        orderBy: { takenAt: "asc" },
        include: { goals: { include: { userGoal: { include: { goal: true } } } } },
      }),
      prisma.userGoal.findMany({ where: { userId: user.id }, include: { goal: true } }),
      prisma.measurement.findMany({
        where: { userId: user.id },
        orderBy: { recordedOn: "asc" },
      }),
      prisma.journalEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.userChallenge.findMany({
        where: { userId: user.id },
        include: { challenge: true },
      }),
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: { achievement: true },
      }),
      prisma.recipe.findMany({
        where: { authorId: user.id },
        include: {
          ingredients: { orderBy: { sortOrder: "asc" } },
          steps: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.recipeFavorite.findMany({
        where: { userId: user.id },
        include: { recipe: { select: { title: true, slug: true } } },
      }),
      prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
      entitlement: user.entitlement,
      timezone: user.profile?.timezone,
      startedOn: user.profile?.startedOn,
    },
    goals: goals.map((g) => ({ slug: g.goal.slug, label: g.goal.label, addedAt: g.createdAt })),
    entries: entries.map((e) => ({
      takenAt: e.takenAt,
      day: e.takenOn.toISOString().slice(0, 10),
      method: e.method,
      amount: Number(e.amount),
      unit: e.unit,
      mood: e.mood,
      notes: e.notes,
      goals: e.goals.map((g) => g.userGoal.goal.label),
    })),
    measurements: measurements.map((m) => ({
      kind: m.kind,
      label: m.customLabel,
      value: Number(m.value),
      secondary: m.secondary ? Number(m.secondary) : null,
      unit: m.unit,
      recordedOn: m.recordedOn.toISOString().slice(0, 10),
      note: m.note,
    })),
    journal: journal.map((j) => ({
      createdAt: j.createdAt,
      prompt: j.prompt,
      body: j.body,
      mood: j.mood,
    })),
    challenges: challenges.map((c) => ({
      title: c.challenge.title,
      status: c.status,
      startedOn: c.startedOn.toISOString().slice(0, 10),
      completedAt: c.completedAt,
    })),
    achievements: achievements.map((a) => ({
      title: a.achievement.title,
      unlockedAt: a.unlockedAt,
    })),
    myRecipes: recipes.map((r) => ({
      title: r.title,
      summary: r.summary,
      category: r.category,
      cayenneAmount: r.cayenneAmount,
      minutes: r.minutes,
      ingredients: r.ingredients.map((i) => i.text),
      steps: r.steps.map((s) => s.text),
    })),
    favoriteRecipes: favorites.map((f) => f.recipe.title),
    notificationPreferences: prefs,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cayenne-do-it-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
