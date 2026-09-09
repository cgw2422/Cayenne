"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { onboardingSchema, type ActionState } from "@/lib/validation";
import { dateColumnFromDayKey, todayInZone } from "@/lib/date";
import { sortSchedule } from "@/lib/doses";

export async function completeOnboarding(payload: {
  goalSlugs: string[];
  method: string | null;
  amount: number | null;
  unit: string;
  reminderEnabled: boolean;
  doses: { minute: number; enabled: boolean }[];
  timezone: string;
}): Promise<ActionState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      message:
        parsed.error.issues[0]?.message ?? "Something in that form didn't look right.",
    };
  }

  const data = parsed.data;
  const schedule = sortSchedule(data.doses);
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
        dosesPerDay: schedule.length,
        timezone: data.timezone || "UTC",
        startedOn: dateColumnFromDayKey(today),
      },
    }),
    prisma.reminderTime.deleteMany({ where: { userId: user.id } }),
    prisma.reminderTime.createMany({
      data: schedule.map((dose, i) => ({
        userId: user.id,
        minute: dose.minute,
        label: schedule.length > 1 ? `Dose ${i + 1}` : null,
        enabled: data.reminderEnabled && dose.enabled,
      })),
    }),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, dailyReminder: data.reminderEnabled },
      update: { dailyReminder: data.reminderEnabled },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { onboardedAt: new Date() },
    }),
  ]);

  redirect("/home?welcome=1");
}
