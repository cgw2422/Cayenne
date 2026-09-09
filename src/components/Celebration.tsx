"use client";

import { useEffect, useState } from "react";

import { Button, cx } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { Flame } from "@/components/ui/Flame";

export type CelebrationPayload = {
  size: "small" | "large";
  headline: string;
  subline: string;
  badges?: { title: string; description: string }[];
  shareHref?: string;
};

const CONFETTI = Array.from({ length: 26 }, (_, i) => {
  const angle = (i / 26) * Math.PI * 2;
  return {
    dx: `${Math.cos(angle) * (90 + (i % 5) * 26)}px`,
    dy: `${Math.sin(angle) * (90 + (i % 4) * 30) + 40}px`,
    dr: `${(i % 2 ? 1 : -1) * (180 + i * 9)}deg`,
    color: ["#D92D20", "#F15A24", "#FFB020", "#12372A"][i % 4],
    delay: `${(i % 6) * 35}ms`,
  };
});

/** Milestone celebration. Small logs get a toast; milestones get the full show. */
export function Celebration({
  payload,
  onDismiss,
}: {
  payload: CelebrationPayload;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const large = payload.size === "large";

  useEffect(() => {
    if (large) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 3200);
    return () => clearTimeout(timer);
  }, [large, onDismiss]);

  if (!visible) return null;

  if (!large) {
    return (
      <div
        role="status"
        className="fixed inset-x-4 bottom-28 z-50 mx-auto max-w-sm animate-rise"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-pepper-900 px-4 py-3.5 text-cream-100 shadow-lift">
          <Flame size={26} className="animate-fire" />
          <div className="min-w-0">
            <p className="font-extrabold leading-tight">{payload.headline}</p>
            <p className="truncate text-sm text-cream-200/80">{payload.subline}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={payload.headline}
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/55 px-6 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm animate-pop rounded-3xl bg-cream-50 p-7 text-center shadow-lift">
        <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="absolute size-2 rounded-[2px] animate-confetti"
              style={
                {
                  backgroundColor: c.color,
                  animationDelay: c.delay,
                  "--dx": c.dx,
                  "--dy": c.dy,
                  "--dr": c.dr,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <Mascot pose="cheer" size={118} className="relative mx-auto" />
        <h2 className="relative mt-3 text-3xl font-extrabold leading-tight text-charcoal-900">
          {payload.headline}
        </h2>
        <p className="relative mt-1.5 text-[15px] text-charcoal-500">{payload.subline}</p>

        {payload.badges?.length ? (
          <ul className="relative mt-5 grid gap-2 text-left">
            {payload.badges.map((badge) => (
              <li
                key={badge.title}
                className="flex items-center gap-3 rounded-2xl border border-cream-300 bg-white px-3.5 py-3"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full fire-gradient text-lg">
                  🏅
                </span>
                <div className="min-w-0">
                  <p className="font-extrabold text-charcoal-900">{badge.title}</p>
                  <p className="text-xs text-charcoal-500">{badge.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={cx("relative mt-6 flex flex-col gap-2.5")}>
          {payload.shareHref ? (
            <a
              href={payload.shareHref}
              className="fire-gradient inline-flex h-12 items-center justify-center rounded-2xl font-extrabold text-white shadow-lift"
            >
              Share this
            </a>
          ) : null}
          <Button variant="secondary" size="md" full onClick={onDismiss}>
            Keep going
          </Button>
        </div>
      </div>
    </div>
  );
}
