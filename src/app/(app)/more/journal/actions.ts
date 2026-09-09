"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { can, FEATURES } from "@/lib/entitlements";
import { fieldErrors, journalSchema, type ActionState } from "@/lib/validation";

export async function saveJournalEntry(input: {
  prompt: string | null;
  body: string;
  mood: number | null;
}): Promise<ActionState> {
  const user = await requireUser();

  if (!can(user.entitlement, FEATURES.JOURNAL)) {
    return { ok: false, message: "The journal is part of the lifetime unlock." };
  }

  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  await prisma.journalEntry.create({
    data: { userId: user.id, ...parsed.data },
  });

  revalidatePath("/more/journal");
  return { ok: true, message: "Saved." };
}

export async function deleteJournalEntry(id: string): Promise<ActionState> {
  const user = await requireUser();
  const { count } = await prisma.journalEntry.deleteMany({
    where: { id, userId: user.id },
  });
  if (!count) return { ok: false, message: "That entry no longer exists." };
  revalidatePath("/more/journal");
  return { ok: true };
}
