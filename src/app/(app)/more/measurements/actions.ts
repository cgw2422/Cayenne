"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { can, FEATURES } from "@/lib/entitlements";
import { dateColumnFromDayKey } from "@/lib/date";
import { fieldErrors, measurementSchema, type ActionState } from "@/lib/validation";

export async function saveMeasurement(input: {
  kind: string;
  customLabel: string | null;
  value: number;
  secondary: number | null;
  unit: string;
  recordedOn: string;
  note: string | null;
}): Promise<ActionState> {
  const user = await requireUser();

  if (!can(user.entitlement, FEATURES.MEASUREMENTS)) {
    return { ok: false, message: "Measurements are part of the lifetime unlock." };
  }

  const parsed = measurementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const data = parsed.data;
  await prisma.measurement.create({
    data: {
      userId: user.id,
      kind: data.kind,
      customLabel: data.kind === "CUSTOM" ? data.customLabel : null,
      value: data.value,
      secondary: data.kind === "BLOOD_PRESSURE" ? data.secondary : null,
      unit: data.unit,
      recordedOn: dateColumnFromDayKey(data.recordedOn),
      note: data.note,
    },
  });

  revalidatePath("/more/measurements");
  return { ok: true, message: "Recorded." };
}

export async function deleteMeasurement(id: string): Promise<ActionState> {
  const user = await requireUser();
  const { count } = await prisma.measurement.deleteMany({
    where: { id, userId: user.id },
  });
  if (!count) return { ok: false, message: "That measurement no longer exists." };
  revalidatePath("/more/measurements");
  return { ok: true };
}
