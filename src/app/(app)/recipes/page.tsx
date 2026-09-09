import Link from "next/link";

import { FavoriteButton } from "@/components/FavoriteButton";
import { RecipeSearch } from "@/components/RecipeSearch";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { Card, EmptyState, SectionTitle, cx } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { can, FEATURES, FREE_RECIPE_LIMIT } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { toggleFavorite } from "./actions";

export const metadata = { title: "Recipes" };
export const dynamic = "force-dynamic";

const CATEGORIES = [
  { key: "ALL", label: "All" },
  { key: "DRINKS", label: "Drinks" },
  { key: "MEALS", label: "Meals" },
  { key: "SNACKS", label: "Snacks" },
  { key: "QUICK_MIXES", label: "Quick Mixes" },
  { key: "MINE", label: "Mine" },
] as const;

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category: rawCategory, q } = await searchParams;
  const user = await requireUser();
  const category = CATEGORIES.find((c) => c.key === rawCategory)?.key ?? "ALL";
  const query = (q ?? "").trim();
  const full = can(user.entitlement, FEATURES.FULL_RECIPES);

  const where = {
    AND: [
      category === "MINE"
        ? { authorId: user.id }
        : { OR: [{ isSystem: true }, { authorId: user.id }] },
      category !== "ALL" && category !== "MINE" ? { category } : {},
      query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" as const } },
              { summary: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {},
    ],
  };

  const [all, favorites] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: [{ isSystem: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        category: true,
        minutes: true,
        difficulty: true,
        isSystem: true,
      },
    }),
    prisma.recipeFavorite.findMany({
      where: { userId: user.id },
      select: { recipeId: true },
    }),
  ]);

  const favoriteIds = new Set(favorites.map((f) => f.recipeId));
  const visible = full ? all : all.slice(0, FREE_RECIPE_LIMIT);
  const lockedCount = all.length - visible.length;

  return (
    <>
      <header className="flex items-baseline justify-between gap-3 px-5 pb-4 pt-6">
        <h1 className="text-2xl font-extrabold text-charcoal-900">Recipes</h1>
        <Link
          href="/recipes/new"
          className="text-sm font-extrabold text-cayenne-600 underline underline-offset-2"
        >
          Add mine
        </Link>
      </header>

      <div className="px-5">
        <RecipeSearch defaultValue={query} category={category} />
      </div>

      <nav
        className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5 pb-4"
        aria-label="Recipe categories"
      >
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/recipes?category=${c.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            aria-current={category === c.key ? "page" : undefined}
            className={cx(
              "shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition-colors",
              category === c.key
                ? "fire-gradient text-white shadow-soft"
                : "border border-cream-300 bg-white text-charcoal-700",
            )}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-3 px-5 pb-6">
        {visible.length === 0 ? (
          <EmptyState
            mascot={<Mascot pose="rest" size={84} />}
            title={category === "MINE" ? "No recipes of your own yet" : "Nothing matched"}
            body={
              category === "MINE"
                ? "Save the way you actually take your cayenne, so you stop reinventing it every morning."
                : "Try a different category, or clear the search."
            }
            action={
              category === "MINE" ? (
                <Link
                  href="/recipes/new"
                  className="fire-gradient mt-1 rounded-2xl px-5 py-3 text-sm font-extrabold text-white shadow-lift"
                >
                  Add a recipe
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid gap-3">
            {visible.map((recipe) => (
              <Card as="li" key={recipe.id} className="flex items-center gap-3 p-3.5">
                <Link
                  href={`/recipes/${recipe.slug}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-cream-100 text-2xl">
                    {recipe.category === "DRINKS"
                      ? "🥤"
                      : recipe.category === "MEALS"
                        ? "🍽️"
                        : recipe.category === "SNACKS"
                          ? "🥨"
                          : "🧂"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-charcoal-900">
                      {recipe.title}
                    </p>
                    <p className="truncate text-sm text-charcoal-500">{recipe.summary}</p>
                    <p className="mt-0.5 text-xs font-bold text-charcoal-500">
                      {recipe.minutes} min · {recipe.difficulty}
                      {!recipe.isSystem ? " · Yours" : ""}
                    </p>
                  </div>
                </Link>
                <FavoriteButton
                  recipeId={recipe.id}
                  initial={favoriteIds.has(recipe.id)}
                  onToggle={toggleFavorite}
                />
              </Card>
            ))}
          </ul>
        )}

        {lockedCount > 0 ? (
          <>
            <SectionTitle>{lockedCount} more recipes</SectionTitle>
            <UpgradeNudge
              feature={FEATURES.FULL_RECIPES}
              body={`Free accounts see ${FREE_RECIPE_LIMIT} recipes. Unlock the full library — plus your own custom recipes — once, forever.`}
            />
          </>
        ) : null}

        <p className="px-1 text-xs leading-relaxed text-charcoal-500">
          Recipes are ideas for working cayenne into food and drinks. They aren&apos;t
          treatments for any condition.
        </p>
      </div>
    </>
  );
}
