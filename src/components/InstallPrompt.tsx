"use client";

import { useEffect, useState } from "react";

import { Button, Card } from "@/components/ui/primitives";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Offers "Add to home screen" only when the browser says it's actually possible. */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !event) return null;

  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-100 text-xl">
        📲
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-charcoal-900">Add to home screen</p>
        <p className="text-sm text-charcoal-500">Opens full screen, like an app.</p>
      </div>
      <Button
        size="sm"
        onClick={async () => {
          await event.prompt();
          const { outcome } = await event.userChoice;
          if (outcome === "accepted") setInstalled(true);
          setEvent(null);
        }}
      >
        Install
      </Button>
    </Card>
  );
}
