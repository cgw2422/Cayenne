"use client";

import { useEffect, useState } from "react";

import { Mascot } from "@/components/ui/Mascot";

/** One-time hello after onboarding, then it gets out of the way. */
export function WelcomeToast() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-50 mx-auto max-w-sm animate-rise"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-pepper-900 px-4 py-3 text-cream-100 shadow-lift">
        <Mascot pose="cheer" size={40} />
        <div>
          <p className="font-extrabold leading-tight">You&apos;re all set.</p>
          <p className="text-sm text-cream-200/80">
            Log today and your streak starts now.
          </p>
        </div>
      </div>
    </div>
  );
}
