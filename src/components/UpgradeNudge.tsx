import Link from "next/link";

import { FEATURE_COPY, LIFETIME_PRICE_USD, type Feature } from "@/lib/entitlements";

/** The single place a locked feature is explained. Never blocks the habit loop. */
export function UpgradeNudge({
  feature,
  body,
}: {
  feature: Feature;
  body?: string;
}) {
  const copy = FEATURE_COPY[feature];
  return (
    <div className="rounded-[1.5rem] border border-cream-300 bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl fire-gradient text-lg">
          🔓
        </span>
        <div className="min-w-0">
          <p className="font-extrabold text-charcoal-900">{copy.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-charcoal-500">
            {body ?? copy.blurb}
          </p>
        </div>
      </div>
      <Link
        href="/more/unlock"
        className="fire-gradient mt-4 flex h-11 items-center justify-center rounded-2xl text-sm font-extrabold text-white shadow-lift"
      >
        Unlock everything · ${LIFETIME_PRICE_USD.toFixed(2)} once
      </Link>
    </div>
  );
}
