import { PrismaClient } from "@prisma/client";

import { ACHIEVEMENTS, CHALLENGES, GOALS, QUOTES, RECIPES } from "./seed-data";

const prisma = new PrismaClient();

/**
 * Seeding runs on every boot (`npm start`), which changes what an upsert's
 * `update` branch means now that content is editable from /admin: anything the
 * seed rewrites there would silently undo an admin's edit on the next deploy.
 *
 * So the rule below is by field, not by row. Code-owned fields — the ones the
 * app's logic depends on, like an achievement's threshold — stay in sync with
 * the seed. Display copy the admin can edit is written once, at creation, and
 * never touched again.
 */
async function main() {
  for (const goal of GOALS) {
    await prisma.goal.upsert({
      where: { slug: goal.slug },
      create: goal,
      update: goal,
    });
  }
  console.log(`✓ ${GOALS.length} goals`);

  for (const challenge of CHALLENGES) {
    // Title, description, duration, premium and active are all editable from
    // /admin/content, so an existing challenge is left exactly as it is.
    await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      create: challenge,
      update: {},
    });
  }
  console.log(`✓ ${CHALLENGES.length} challenges`);

  for (const achievement of ACHIEVEMENTS) {
    const { title, description, ...owned } = achievement;
    // `kind`, `threshold`, `tier` and `sortOrder` decide who has earned what, so
    // they follow the code. Title and description are the admin's to edit.
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      create: { ...owned, title, description },
      update: owned,
    });
  }
  console.log(`✓ ${ACHIEVEMENTS.length} achievements`);

  for (const quote of QUOTES) {
    // Category, personality, milestone and retirement are all editable, so a
    // quote that already exists is never rewritten.
    await prisma.quote.upsert({
      where: { text: quote.text },
      create: quote,
      update: {},
    });
  }
  console.log(`✓ ${QUOTES.length} quotes`);

  for (const recipe of RECIPES) {
    const { ingredients, steps, ...fields } = recipe;
    const saved = await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      create: fields,
      update: fields,
    });
    // Rewrite children so re-seeding never duplicates them.
    await prisma.recipeIngredient.deleteMany({ where: { recipeId: saved.id } });
    await prisma.recipeStep.deleteMany({ where: { recipeId: saved.id } });
    await prisma.recipeIngredient.createMany({
      data: ingredients.map((text, i) => ({ recipeId: saved.id, text, sortOrder: i })),
    });
    await prisma.recipeStep.createMany({
      data: steps.map((text, i) => ({ recipeId: saved.id, text, sortOrder: i })),
    });
  }
  console.log(`✓ ${RECIPES.length} recipes`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
