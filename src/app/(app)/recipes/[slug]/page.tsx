import Link from "next/link";
import { notFound } from "next/navigation";

import { FavoriteButton } from "@/components/FavoriteButton";
import { Card } from "@/components/ui/primitives";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { toggleFavorite } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: recipe?.title ?? "Recipe" };
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();

  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
      steps: { orderBy: { sortOrder: "asc" } },
      favorites: { where: { userId: user.id }, select: { id: true } },
    },
  });

  // A private recipe belongs to its author alone.
  if (!recipe || (!recipe.isSystem && recipe.authorId !== user.id)) notFound();

  return (
    <>
      <header className="flex items-center gap-3 px-5 pb-4 pt-5">
        <Link
          href="/recipes"
          aria-label="Back to recipes"
          className="tap grid place-items-center rounded-full text-charcoal-700"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m14.5 5-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="flex-1 truncate text-xl font-extrabold text-charcoal-900">
          {recipe.title}
        </h1>
        <FavoriteButton
          recipeId={recipe.id}
          initial={recipe.favorites.length > 0}
          onToggle={toggleFavorite}
        />
      </header>

      <div className="flex flex-col gap-4 px-5 pb-8">
        <div className="flex h-40 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cream-200 to-cream-300 text-6xl">
          {recipe.category === "DRINKS"
            ? "🥤"
            : recipe.category === "MEALS"
              ? "🍽️"
              : recipe.category === "SNACKS"
                ? "🥨"
                : "🧂"}
        </div>

        <p className="text-[15px] leading-relaxed text-charcoal-700">{recipe.summary}</p>

        <div className="grid grid-cols-3 gap-2.5">
          <Fact label="Time" value={`${recipe.minutes} min`} />
          <Fact label="Difficulty" value={recipe.difficulty} />
          <Fact label="Cayenne" value={recipe.cayenneAmount} />
        </div>

        <Card>
          <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            Ingredients
          </h2>
          <ul className="grid gap-2.5">
            {recipe.ingredients.map((item) => (
              <li key={item.id} className="flex gap-3 text-[15px] text-charcoal-900">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-cayenne-600" />
                {item.text}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            Instructions
          </h2>
          <ol className="grid gap-4">
            {recipe.steps.map((step, i) => (
              <li key={step.id} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full fire-gradient text-xs font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="text-[15px] leading-relaxed text-charcoal-900">{step.text}</p>
              </li>
            ))}
          </ol>
        </Card>

        <p className="text-xs leading-relaxed text-charcoal-500">
          A way to enjoy cayenne — not a treatment for any condition. Start with less
          than you think and adjust to taste.
        </p>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cream-300 bg-white px-3 py-2.5 text-center">
      <p className="truncate text-sm font-extrabold text-charcoal-900">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
        {label}
      </p>
    </div>
  );
}
