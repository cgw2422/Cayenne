"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Debounced search that keeps the URL as the source of truth. */
export function RecipeSearch({
  defaultValue,
  category,
}: {
  defaultValue: string;
  category: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (value === defaultValue) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ category });
      if (value.trim()) params.set("q", value.trim());
      router.replace(`/recipes?${params.toString()}`);
    }, 320);
    return () => clearTimeout(timer);
  }, [value, defaultValue, category, router]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search recipes…"
        aria-label="Search recipes"
        className="h-12 w-full rounded-2xl border border-cream-300 bg-white pl-11 pr-4 text-[15px] outline-none placeholder:text-charcoal-500/60 focus:border-ember-400"
      />
    </div>
  );
}
