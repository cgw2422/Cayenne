import { SubHeader } from "../_SubHeader";
import { UnlockButton } from "@/components/UnlockButton";
import { Card } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { FEATURE_COPY, FEATURES, LIFETIME_PRICE_USD } from "@/lib/entitlements";
import { requireUser } from "@/server/auth";
import { grantLifetime } from "../settings/actions";

export const metadata = { title: "Unlock everything" };
export const dynamic = "force-dynamic";

const FREE_LIST = [
  "Create an account",
  "Log cayenne, every day",
  "Your current streak",
  "A daily quote",
  "7 days of history",
];

export default async function UnlockPage() {
  const user = await requireUser();
  const lifetime = user.entitlement === "LIFETIME";

  return (
    <>
      <SubHeader title="Unlock everything" />

      <div className="flex flex-col gap-4 px-5 pb-8">
        <div className="rounded-[1.75rem] bg-pepper-900 px-6 py-7 text-center text-cream-100">
          <Mascot pose="cheer" size={92} className="mx-auto" />
          <p className="mt-3 text-3xl font-extrabold">
            ${LIFETIME_PRICE_USD.toFixed(2)}
          </p>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-ember-400">
            One time. Forever.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream-200/80">
            No subscription, no renewals, no upsells later. Pay once and every feature
            below is yours.
          </p>
        </div>

        <Card>
          <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            Always free
          </h2>
          <ul className="grid gap-2">
            {FREE_LIST.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[15px] text-charcoal-900">
                <span className="text-pepper-400">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-charcoal-500">
            The habit loop stays free on purpose. Build the streak first, then decide.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            Lifetime unlock
          </h2>
          <ul className="grid gap-3">
            {Object.values(FEATURES).map((feature) => (
              <li key={feature} className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-cayenne-600">🔓</span>
                <div>
                  <p className="font-extrabold text-charcoal-900">
                    {FEATURE_COPY[feature].title}
                  </p>
                  <p className="text-sm leading-relaxed text-charcoal-500">
                    {FEATURE_COPY[feature].blurb}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {lifetime ? (
          <div className="rounded-2xl border border-cream-300 bg-white p-5 text-center">
            <p className="font-extrabold text-charcoal-900">🔓 Already unlocked</p>
            <p className="mt-1 text-sm text-charcoal-500">
              Everything here is yours. Thanks for backing this.
            </p>
          </div>
        ) : (
          <UnlockButton onUnlock={grantLifetime} />
        )}
      </div>
    </>
  );
}
