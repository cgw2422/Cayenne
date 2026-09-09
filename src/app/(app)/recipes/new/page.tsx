import Link from "next/link";

import { RecipeForm } from "@/components/RecipeForm";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { can, FEATURES } from "@/lib/entitlements";
import { requireUser } from "@/server/auth";
import { createRecipe } from "../actions";

export const metadata = { title: "New recipe" };

export default async function NewRecipePage() {
  const user = await requireUser();
  const allowed = can(user.entitlement, FEATURES.CUSTOM_RECIPES);

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
        <h1 className="text-xl font-extrabold text-charcoal-900">Your own recipe</h1>
      </header>

      {allowed ? (
        <RecipeForm onSave={createRecipe} />
      ) : (
        <div className="px-5 pb-8">
          <UpgradeNudge feature={FEATURES.CUSTOM_RECIPES} />
        </div>
      )}
    </>
  );
}
