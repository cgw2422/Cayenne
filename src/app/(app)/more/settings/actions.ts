"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { destroySession, requireUser, verifyPassword } from "@/server/auth";
import type { ActionState } from "@/lib/validation";

export async function updateSettings(input: {
  displayName: string;
  defaultMethod: string | null;
  defaultAmount: number | null;
  defaultUnit: string;
  unitSystem: string;
  timezone: string;
  dailyReminder: boolean;
  reminderMinute: number;
  streakWarning: boolean;
  milestoneAlert: boolean;
}): Promise<ActionState> {
  const user = await requireUser();

  const displayName = input.displayName.trim().slice(0, 60);
  if (!displayName) {
    return { ok: false, errors: { displayName: "Your name can't be empty." } };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { displayName } }),
    prisma.profile.update({
      where: { userId: user.id },
      data: {
        defaultMethod: (input.defaultMethod as never) ?? null,
        defaultAmount: input.defaultAmount,
        defaultUnit: input.defaultUnit as never,
        unitSystem: input.unitSystem as never,
        timezone: input.timezone || "UTC",
      },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailyReminder: input.dailyReminder,
        reminderMinute: input.reminderMinute,
        streakWarning: input.streakWarning,
        milestoneAlert: input.milestoneAlert,
      },
      update: {
        dailyReminder: input.dailyReminder,
        reminderMinute: input.reminderMinute,
        streakWarning: input.streakWarning,
        milestoneAlert: input.milestoneAlert,
      },
    }),
  ]);

  revalidatePath("/more/settings");
  revalidatePath("/home");
  return { ok: true, message: "Saved." };
}

export async function updateGoals(goalSlugs: string[]): Promise<ActionState> {
  const user = await requireUser();

  const goals = await prisma.goal.findMany({
    where: { slug: { in: goalSlugs } },
    select: { id: true },
  });

  await prisma.$transaction([
    // Keep goals the user still wants; only remove the ones they deselected.
    prisma.userGoal.deleteMany({
      where: { userId: user.id, goalId: { notIn: goals.map((g) => g.id) } },
    }),
    prisma.userGoal.createMany({
      data: goals.map((g) => ({ userId: user.id, goalId: g.id })),
      skipDuplicates: true,
    }),
  ]);

  revalidatePath("/more/goals");
  revalidatePath("/progress");
  return { ok: true, message: "Goals updated." };
}

/** Hard delete. Every related row cascades from `User`. */
export async function deleteAccount(password: string): Promise<ActionState> {
  const user = await requireUser();

  if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, message: "That password doesn't match." };
  }

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}

/** Development-only entitlement switch, standing in for a payment webhook. */
export async function grantLifetime(): Promise<ActionState> {
  const user = await requireUser();
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_UNLOCK) {
    return { ok: false, message: "Payments aren't connected yet." };
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { entitlement: "LIFETIME", entitledAt: new Date() },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Lifetime unlocked." };
}
