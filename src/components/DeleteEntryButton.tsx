"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

export function DeleteEntryButton({
  entryId,
  onDelete,
}: {
  entryId: string;
  onDelete: (id: string) => Promise<ActionState>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="danger" full onClick={() => setConfirming(true)}>
        Delete this entry
      </Button>
    );
  }

  return (
    <div className="rounded-2xl border border-cayenne-200 bg-cayenne-50 p-4">
      <p className="mb-3 text-sm font-bold text-cayenne-800">
        Delete this entry? Your streak will be recalculated.
      </p>
      <div className="flex gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await onDelete(entryId);
              router.push("/home");
              router.refresh();
            })
          }
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Keep it
        </Button>
      </div>
    </div>
  );
}
