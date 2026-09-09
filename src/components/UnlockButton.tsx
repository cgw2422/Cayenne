"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/primitives";
import { LIFETIME_PRICE_USD } from "@/lib/entitlements";
import type { ActionState } from "@/lib/validation";

/**
 * Stands in for the payment step. The entitlement itself lives on `User`, so
 * wiring Stripe or an in-app purchase later means replacing this button's action
 * with a checkout redirect — nothing else in the app changes.
 */
export function UnlockButton({ onUnlock }: { onUnlock: () => Promise<ActionState> }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2.5">
      <Button
        size="lg"
        full
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await onUnlock();
            setMessage(result.message ?? null);
            if (result.ok) router.refresh();
          })
        }
      >
        {pending ? "Unlocking…" : `Unlock for $${LIFETIME_PRICE_USD.toFixed(2)}`}
      </Button>

      {message ? (
        <p role="status" className="text-center text-sm font-extrabold text-pepper-600">
          {message}
        </p>
      ) : null}

      <p className="text-center text-xs leading-relaxed text-charcoal-500">
        Card payments aren&apos;t connected in this build. The entitlement is stored on
        your account, so a future Stripe or App Store purchase unlocks exactly the same
        thing.
      </p>
    </div>
  );
}
