import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("That doesn't look like an email address.")
  .max(254)
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.");

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "What should we call you?")
    .max(60, "Keep it under 60 characters."),
  email: emailSchema,
  password: passwordSchema,
  timezone: z.string().max(80).optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

/** A single reminder: minutes past local midnight, plus its own on/off switch. */
export const doseSchema = z.object({
  minute: z.number().int().min(0).max(1439),
  enabled: z.boolean(),
});

/** Times must be distinct — the database has a unique index on (user, minute). */
export const doseListSchema = z
  .array(doseSchema)
  .min(1, "Set at least one time.")
  .max(6, "Six a day is the most we'll track.")
  .refine((doses) => new Set(doses.map((d) => d.minute)).size === doses.length, {
    message: "Two reminders are set to the same time.",
  });

export const onboardingSchema = z.object({
  goalSlugs: z.array(z.string()).min(1, "Pick at least one, or choose Other."),
  method: z.enum(["WATER", "TEA", "FOOD", "SHOT", "CAPSULE", "OTHER"]).nullable(),
  amount: z.coerce.number().positive().max(10000).nullable(),
  unit: z.enum(["TSP", "MG", "G", "CAPSULE"]),
  reminderEnabled: z.boolean(),
  doses: doseListSchema,
  timezone: z.string().max(80),
});

export const entrySchema = z.object({
  takenAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  method: z.enum(["WATER", "TEA", "FOOD", "SHOT", "CAPSULE", "OTHER"]),
  amount: z.coerce.number().positive("Enter an amount.").max(10000),
  unit: z.enum(["TSP", "MG", "G", "CAPSULE"]),
  mood: z.coerce.number().int().min(1).max(5).nullable(),
  notes: z.string().trim().max(2000).nullable(),
  userGoalIds: z.array(z.string()).max(20),
});

export const measurementSchema = z.object({
  kind: z.enum(["WEIGHT", "WAIST", "BLOOD_PRESSURE", "BLOOD_GLUCOSE", "CUSTOM"]),
  customLabel: z.string().trim().max(60).nullable(),
  value: z.coerce.number().min(0).max(100000),
  secondary: z.coerce.number().min(0).max(100000).nullable(),
  unit: z.string().trim().min(1).max(20),
  recordedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date."),
  note: z.string().trim().max(500).nullable(),
});

export const journalSchema = z.object({
  prompt: z.string().trim().max(200).nullable(),
  body: z.string().trim().min(1, "Write something first.").max(5000),
  mood: z.coerce.number().int().min(1).max(5).nullable(),
});

export const recipeSchema = z.object({
  title: z.string().trim().min(1, "Give it a name.").max(120),
  summary: z.string().trim().max(400),
  category: z.enum(["DRINKS", "MEALS", "SNACKS", "QUICK_MIXES"]),
  cayenneAmount: z.string().trim().min(1, "How much cayenne?").max(60),
  minutes: z.coerce.number().int().min(1).max(600),
  ingredients: z.array(z.string().trim().min(1)).min(1, "Add an ingredient."),
  steps: z.array(z.string().trim().min(1)).min(1, "Add a step."),
});

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Ids of achievements unlocked by this action, for the celebration overlay. */
  unlocked?: string[];
};

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
