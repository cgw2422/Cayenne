"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { onboardingSchema, type ActionState } from "@/lib/validation";
import { dateColumnFromDayKey, todayInZone } from "@/lib/date";

export async function completeOnboarding(payload: {
  goalSlugs: string[];
  method: string | null;
  amount: number | null;
  unit: string;
  reminderEnabled: boolean;
  reminderMinute: number;
  timezone: string;
}): Promise<ActionState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "Something in that form didn't look right." };
  }

  const data = parsed.data;
  const goals = await prisma.goal.findMany({
    where: { slug: { in: data.goalSlugs } },
    select: { id: true },
  });

  const today = todayInZone(data.timezone || "UTC");

  await prisma.$transaction([
    prisma.userGoal.deleteMany({ where: { userId: user.id } }),
    prisma.userGoal.createMany({
      data: goals.map((g) => ({ userId: user.id, goalId: g.id })),
      skipDuplicates: true,
    }),
    prisma.profile.update({
      where: { userId: user.id },
      data: {
        defaultMethod: data.method as never,
        defaultAmount: data.amount,
        defaultUnit: data.unit as never,
        timezone: data.timezone || "UTC",
        startedOn: dateColumnFromDayKey(today),
      },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyReminder: data.reminderEnabled,
        reminderMinute: data.reminderMinute,
      },
      update: {
        dailyReminder: data.reminderEnabled,
        reminderMinute: data.reminderMinute,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { onboardedAt: new Date() },
    }),
  ]);

  redirect("/home?welcome=1");
}
