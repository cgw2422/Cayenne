"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/primitives";

type State = "unsupported" | "default" | "granted" | "denied";

/**
 * Requests browser notification permission. Permission is only ever asked for on
 * an explicit tap — never on page load.
 */
export function NotificationSetup({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<State>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as State);
  }, []);

  if (state === "unsupported") {
    return (
      <p className="text-xs leading-relaxed text-charcoal-500">
        This browser doesn&apos;t support notifications. Add Cayenne Do It to your home
        screen and reminders will work there.
      </p>
    );
  }

  if (state === "granted") {
    return (
      <p className="text-xs font-bold text-pepper-600">
        ✓ Notifications are on for this device.
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className="text-xs leading-relaxed text-charcoal-500">
        Notifications are blocked for this site. You can re-enable them in your
        browser&apos;s site settings.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs leading-relaxed text-charcoal-500">
        {enabled
          ? "Allow notifications so your reminder can actually reach you."
          : "Turn on the daily reminder above first."}
      </p>
      <Button
        size="sm"
        variant="secondary"
        disabled={!enabled}
        onClick={async () => {
          const result = await Notification.requestPermission();
          setState(result as State);
        }}
      >
        Allow notifications
      </Button>
    </div>
  );
}
