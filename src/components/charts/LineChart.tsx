"use client";

import { useId, useMemo, useState } from "react";

export type Point = { x: string; y: number | null; label?: string };

/**
 * Value formatting is described declaratively rather than passed as a callback —
 * server components can't hand a function to a client component.
 */
export type ValueFormat =
  | { kind: "raw"; decimals?: number }
  | { kind: "mood" }
  | { kind: "percent" }
  | { kind: "unit"; unit: string; decimals?: number };

const MOOD_LABELS = ["", "Terrible", "Not great", "Okay", "Good", "Great"];

function formatValue(value: number, format: ValueFormat): string {
  switch (format.kind) {
    case "mood":
      return MOOD_LABELS[Math.min(5, Math.max(1, Math.round(value)))];
    case "percent":
      return `${Math.round(value)}%`;
    case "unit":
      return `${Number(value.toFixed(format.decimals ?? 3))} ${format.unit}`;
    default:
      return String(Number(value.toFixed(format.decimals ?? 2)));
  }
}

/**
 * Small dependency-free trend chart. Gaps (null y) break the line rather than
 * interpolating, so a missed day never invents data.
 */
export function LineChart({
  points,
  height = 150,
  yMin,
  yMax,
  format = { kind: "raw" } as ValueFormat,
  accent = "#D92D20",
  ariaLabel,
}: {
  points: Point[];
  height?: number;
  yMin?: number;
  yMax?: number;
  format?: ValueFormat;
  accent?: string;
  ariaLabel: string;
}) {
  const gradientId = useId();
  const [active, setActive] = useState<number | null>(null);

  const values = points.map((p) => p.y).filter((v): v is number => v !== null);
  const min = yMin ?? (values.length ? Math.min(...values) : 0);
  const max = yMax ?? (values.length ? Math.max(...values) : 1);
  const span = max - min || 1;

  const W = 320;
  const H = height;
  const PAD_LEFT = 8;
  const PAD_RIGHT = 8;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 22;
  const innerW = W - PAD_LEFT - PAD_RIGHT;
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const coords = useMemo(
    () =>
      points.map((p, i) => ({
        ...p,
        cx:
          PAD_LEFT +
          (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW),
        cy: p.y === null ? null : PAD_TOP + innerH - ((p.y - min) / span) * innerH,
      })),
    [points, innerW, innerH, min, span],
  );

  const segments: string[] = [];
  let current: string[] = [];
  for (const c of coords) {
    if (c.cy === null) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
      continue;
    }
    current.push(`${current.length ? "L" : "M"}${c.cx.toFixed(1)} ${c.cy.toFixed(1)}`);
  }
  if (current.length > 1) segments.push(current.join(" "));

  const first = coords.find((c) => c.cy !== null);
  const last = [...coords].reverse().find((c) => c.cy !== null);
  const area =
    first && last && segments.length
      ? `${segments[0]} L${last.cx.toFixed(1)} ${PAD_TOP + innerH} L${first.cx.toFixed(
          1,
        )} ${PAD_TOP + innerH} Z`
      : "";

  // A single point can't show a trend, and a lone dot reads as a broken chart.
  if (values.length < 2) {
    const only = values[0];
    return (
      <div
        className="flex h-[150px] flex-col items-center justify-center gap-1 rounded-2xl bg-cream-100 px-5 text-center"
        role="img"
        aria-label={
          values.length
            ? `${ariaLabel}: one data point, ${formatValue(only, format)}`
            : `${ariaLabel}: no data yet`
        }
      >
        {values.length ? (
          <>
            <p className="text-2xl font-extrabold text-charcoal-900">
              {formatValue(only, format)}
            </p>
            <p className="text-sm font-semibold text-charcoal-500">
              One day in. The trend line starts tomorrow.
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold text-charcoal-500">
            Nothing logged in this range yet.
          </p>
        )}
      </div>
    );
  }

  const hovered = active !== null ? coords[active] : null;
  const slotWidth = innerW / Math.max(1, coords.length);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${ariaLabel}. Latest value ${formatValue(last?.y ?? 0, format)}.`}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => (
          <line
            key={t}
            x1={PAD_LEFT}
            x2={W - PAD_RIGHT}
            y1={PAD_TOP + innerH * t}
            y2={PAD_TOP + innerH * t}
            stroke="#EDDFC4"
            strokeWidth="1"
            strokeDasharray={t === 1 ? undefined : "3 5"}
          />
        ))}

        {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}

        {segments.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={accent}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {coords.map((c, i) =>
          c.cy === null ? null : (
            <circle
              key={c.x}
              cx={c.cx}
              cy={c.cy}
              r={active === i ? 5 : 3}
              fill="#fff"
              stroke={accent}
              strokeWidth="2.2"
            />
          ),
        )}

        {/* Invisible wide hit areas so a fingertip can pick a point. */}
        {coords.map((c, i) => (
          <rect
            key={`hit-${c.x}`}
            x={c.cx - slotWidth / 2}
            y={0}
            width={slotWidth}
            height={H}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onTouchStart={() => setActive(i)}
          />
        ))}

        <text x={PAD_LEFT} y={H - 5} fontSize="10" fill="#6B6660" fontWeight="700">
          {points[0]?.label ?? points[0]?.x}
        </text>
        <text
          x={W - PAD_RIGHT}
          y={H - 5}
          fontSize="10"
          fill="#6B6660"
          textAnchor="end"
          fontWeight="700"
        >
          {points[points.length - 1]?.label ?? points[points.length - 1]?.x}
        </text>
      </svg>

      {hovered && hovered.cy !== null ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-charcoal-900 px-2.5 py-1.5 text-xs font-bold text-cream-100 shadow-lift"
          style={{
            left: `${(hovered.cx / W) * 100}%`,
            top: `${(hovered.cy / H) * 100}%`,
          }}
        >
          {hovered.label ?? hovered.x}: {formatValue(hovered.y as number, format)}
        </div>
      ) : null}
    </div>
  );
}
