"use client";

import { useEffect, useState } from "react";

import { Flame } from "@/components/ui/Flame";
import { cx } from "@/components/ui/primitives";
import { MILESTONE_TITLES, ringProgress, type Milestone } from "@/lib/streak";

const SIZE = 220;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The animated fire ring. Progress is measured toward the next milestone rather
 * than an arbitrary cap, so the arc always means something.
 */
export function StreakRing({
  streak,
  loggedToday,
  nextMilestone,
  dosesLogged = 0,
  dosesTarget = 1,
}: {
  streak: number;
  loggedToday: boolean;
  nextMilestone: number | null;
  dosesLogged?: number;
  dosesTarget?: number;
}) {
  const target = ringProgress(streak);
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(streak > 0 ? 0 : 0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setProgress(target));
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // Count the number up once on mount — small reward for opening the app.
  useEffect(() => {
    if (streak === 0) {
      setCount(0);
      return;
    }
    const duration = Math.min(900, 220 + streak * 18);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * streak));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [streak]);

  const cold = streak === 0;
  const toGo = nextMilestone ? nextMilestone - streak : 0;

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="ring-fire"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2={SIZE}
            y2={SIZE}
          >
            <stop offset="0%" stopColor="#D92D20" />
            <stop offset="50%" stopColor="#F15A24" />
            <stop offset="100%" stopColor="#FFB020" />
          </linearGradient>
        </defs>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#F3E7D2"
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={cold ? "#DCD4C6" : "url(#ring-fire)"}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - (cold ? 0.04 : progress))}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <Flame
          size={34}
          muted={cold}
          className={cold ? undefined : "animate-fire drop-shadow-sm"}
        />
        <span className="text-[54px] font-extrabold leading-none tabular-nums text-charcoal-900">
          {count}
        </span>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-charcoal-500">
          Day streak
        </span>
        {dosesTarget > 1 ? (
          <span
            className={cx(
              "mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider",
              dosesLogged >= dosesTarget
                ? "bg-pepper-900 text-cream-100"
                : "bg-cream-300 text-charcoal-700",
            )}
          >
            {dosesLogged >= dosesTarget ? "✓ " : ""}
            {dosesLogged} of {dosesTarget} today
          </span>
        ) : loggedToday ? (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-pepper-900 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-cream-100">
            ✓ Logged today
          </span>
        ) : nextMilestone ? (
          <span className="mt-1.5 text-[11px] font-semibold text-charcoal-500">
            {toGo} {toGo === 1 ? "day" : "days"} to{" "}
            {MILESTONE_TITLES[nextMilestone as Milestone] ?? `${nextMilestone} days`}
          </span>
        ) : null}
      </div>
    </div>
  );
}
