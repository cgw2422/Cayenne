"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { fieldErrors, recipeSchema, type ActionState } from "@/lib/validation";
import { can, FEATURES } from "@/lib/entitlements";
import { evaluateAchievements } from "@/server/habit";
import { streakFor } from "@/server/habit";

export async function toggleFavorite(recipeId: string): Promise<ActionState> {
  const user = await requireUser();

  const existing = await prisma.recipeFavorite.findUnique({
    where: { userId_recipeId: { userId: user.id, recipeId } },
  });

  if (existing) {
    await prisma.recipeFavorite.delete({ where: { id: existing.id } });
  } else {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { id: true, isSystem: true, authorId: true },
    });
    if (!recipe || (!recipe.isSystem && recipe.authorId !== user.id)) {
      return { ok: false, message: "That recipe isn't available." };
    }
    await prisma.recipeFavorite.create({ data: { userId: user.id, recipeId } });

    const summary = await streakFor(user);
    await evaluateAchievements(user.id, summary);
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${recipeId}`);
  return { ok: true };
}

export async function createRecipe(input: {
  title: string;
  summary: string;
  category: string;
  cayenneAmount: string;
  minutes: number;
  ingredients: string[];
  steps: string[];
}): Promise<ActionState & { slug?: string }> {
  const user = await requireUser();

  if (!can(user.entitlement, FEATURES.CUSTOM_RECIPES)) {
    return { ok: false, message: "Custom recipes are part of the lifetime unlock." };
  }

  const parsed = recipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const data = parsed.data;
  const base = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const slug = `${base || "recipe"}-${Math.random().toString(36).slice(2, 7)}`;

  const recipe = await prisma.recipe.create({
    data: {
      slug,
      title: data.title,
      summary: data.summary,
      category: data.category,
      cayenneAmount: data.cayenneAmount,
      minutes: data.minutes,
      isSystem: false,
      authorId: user.id,
      ingredients: {
        create: data.ingredients.map((text, i) => ({ text, sortOrder: i })),
      },
      steps: { create: data.steps.map((text, i) => ({ text, sortOrder: i })) },
    },
  });

  revalidatePath("/recipes");
  return { ok: true, slug: recipe.slug };
}

export async function deleteRecipe(recipeId: string): Promise<ActionState> {
  const user = await requireUser();
  const { count } = await prisma.recipe.deleteMany({
    where: { id: recipeId, authorId: user.id, isSystem: false },
  });
  if (!count) return { ok: false, message: "That recipe isn't yours to delete." };
  revalidatePath("/recipes");
  return { ok: true };
}
