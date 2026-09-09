"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-8 text-center">
      <Mascot pose="rest" size={110} />
      <h1 className="text-2xl font-extrabold text-charcoal-900">
        Well, that got a bit too spicy
      </h1>
      <p className="text-[15px] leading-relaxed text-charcoal-500">
        Something went wrong on our end. Your streak and everything you&apos;ve logged
        are safe.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
