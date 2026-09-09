"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/primitives";

export function SignOutButton({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      full
      disabled={pending}
      onClick={() => startTransition(() => onSignOut())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
