import { cx } from "@/components/ui/primitives";

/**
 * A small sparkline-style area chart, rendered server-side as plain SVG.
 *
 * No charting library: the whole requirement is "show a number over time", and
 * a dependency for that would cost more in bundle size than it saves in code.
 * Rendering on the server also means the admin dashboard ships no chart
 * JavaScript at all.
 */
export function TrendChart({
  points,
  label,
  total,
  summaryNote,
  accent = "#0f172a",
  className,
}: {
  points: { day: string; value: number }[];
  label: string;
  total: number;
  /** What the headline number means, when it isn't a plain total. */
  summaryNote?: string;
  accent?: string;
  className?: string;
}) {
  const width = 640;
  const height = 140;
  const pad = { top: 10, right: 4, bottom: 18, left: 4 };
  const inner = { w: width - pad.left - pad.right, h: height - pad.top - pad.bottom };

  const max = Math.max(1, ...points.map((p) => p.value));
  const step = points.length > 1 ? inner.w / (points.length - 1) : 0;

  const x = (i: number) => pad.left + i * step;
  const y = (value: number) => pad.top + inner.h - (value / max) * inner.h;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = points.length
    ? `${line} L${x(points.length - 1).toFixed(1)},${(pad.top + inner.h).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + inner.h).toFixed(1)} Z`
    : "";

  const peak = points.reduce(
    (best, p, i) => (p.value > best.value ? { value: p.value, i } : best),
    { value: -1, i: 0 },
  );

  return (
    <figure
      className={cx(
        "rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
    >
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
          {total.toLocaleString()}
          {summaryNote ? (
            <span className="ml-1 font-normal text-[11px] text-slate-500">
              {summaryNote}
            </span>
          ) : null}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-32 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${label}: ${total.toLocaleString()}${summaryNote ? ` ${summaryNote}` : ""} over ${points.length} days, peak ${peak.value.toLocaleString()}`}
      >
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + inner.h}
          y2={pad.top + inner.h}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth="1"
        />
        {area ? <path d={area} fill={accent} opacity="0.10" /> : null}
        {line ? (
          <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
        ) : null}
        {peak.value > 0 ? (
          <circle cx={x(peak.i)} cy={y(peak.value)} r="3" fill={accent} />
        ) : null}
      </svg>

      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-400">
        <span>{points[0]?.day ?? ""}</span>
        <span>peak {peak.value.toLocaleString()}</span>
        <span>{points[points.length - 1]?.day ?? ""}</span>
      </div>
    </figure>
  );
}
