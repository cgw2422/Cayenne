"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { can, FEATURES } from "@/lib/entitlements";
import { dateColumnFromDayKey, todayInZone } from "@/lib/date";
import type { ActionState } from "@/lib/validation";

export async function joinChallenge(challengeId: string): Promise<ActionState> {
  const user = await requireUser();

  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) return { ok: false, message: "That challenge no longer exists." };

  if (challenge.isPremium && !can(user.entitlement, FEATURES.ALL_CHALLENGES)) {
    return { ok: false, message: "That challenge is part of the lifetime unlock." };
  }

  const active = await prisma.userChallenge.findFirst({
    where: { userId: user.id, challengeId, status: "ACTIVE" },
  });
  if (active) return { ok: true };

  const today = todayInZone(user.profile?.timezone ?? "UTC");
  await prisma.userChallenge.create({
    data: {
      userId: user.id,
      challengeId,
      startedOn: dateColumnFromDayKey(today),
    },
  });

  revalidatePath("/more/challenges");
  revalidatePath("/home");
  return { ok: true, message: `${challenge.title} started.` };
}

export async function leaveChallenge(userChallengeId: string): Promise<ActionState> {
  const user = await requireUser();
  const { count } = await prisma.userChallenge.updateMany({
    where: { id: userChallengeId, userId: user.id, status: "ACTIVE" },
    data: { status: "ABANDONED" },
  });
  if (!count) return { ok: false, message: "That challenge isn't active." };

  revalidatePath("/more/challenges");
  revalidatePath("/home");
  return { ok: true, message: "No hard feelings. Start another whenever." };
}
