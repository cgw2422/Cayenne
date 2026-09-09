import { PrismaClient } from "@prisma/client";

import { ACHIEVEMENTS, CHALLENGES, GOALS, QUOTES, RECIPES } from "./seed-data";

const prisma = new PrismaClient();

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
    await prisma.challenge.upsert({
      where: { slug: challenge.slug },
      create: challenge,
      update: challenge,
    });
  }
  console.log(`✓ ${CHALLENGES.length} challenges`);

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      create: achievement,
      update: achievement,
    });
  }
  console.log(`✓ ${ACHIEVEMENTS.length} achievements`);

  for (const quote of QUOTES) {
    await prisma.quote.upsert({
      where: { text: quote.text },
      create: quote,
      update: { category: quote.category },
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
