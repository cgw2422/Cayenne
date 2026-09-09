import React from "react";

/**
 * Illustrated art for share cards, all inline SVG.
 *
 * These exist so a card is unmistakably about cayenne rather than being a
 * generic streak graphic. The image renderer has no emoji font and no blur
 * filter, so everything here is built from solid paths and layered opacity.
 */


/** One circle as a sub-path, so many dots can share a single <path> element. */
function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
}

/**
 * A whole cayenne pepper: long, slender and tapering to a fine point. The
 * proportions matter — anything squatter reads as a bell pepper or an
 * aubergine, and the whole point is that these cards are unmistakably cayenne.
 *
 * `size` is the pepper's height; width follows at roughly a third of it.
 */
export function Pepper({
  size,
  rotate = 0,
  body = "#D92D20",
  shade = "#A3170F",
  stem = "#2F6B53",
  opacity = 1,
}: {
  size: number;
  rotate?: number;
  body?: string;
  shade?: string;
  stem?: string;
  opacity?: number;
}) {
  return (
    <svg
      width={size * 0.4}
      height={size}
      viewBox="0 0 68 170"
      style={{ transform: `rotate(${rotate}deg)`, opacity }}
    >
      {/* body: broad shoulders, a long taper, tip drifting right */}
      <path
        d="M20 44Q8 100 38 156Q58 98 48 44Q34 34 20 44Z"
        fill={body}
      />
      {/* shaded flank gives volume without a gradient */}
      <path
        d="M34 38q16 4 14 46 4 44-10 72-2-30 2-58 3-32-6-60Z"
        fill={shade}
        opacity="0.5"
      />
      {/* highlight down the lit edge */}
      <path
        d="M24 52q-6 30 2 58"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.34"
      />
      {/* calyx */}
      <path d="M17 42q17-11 34 0-17 8-34 0Z" fill={stem} />
      {/* stalk */}
      <path
        d="M34 40q-3-20 8-30"
        stroke={stem}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Ground cayenne: a drift of fine grains. Deterministic, never random. */
export function PowderField({
  width,
  height,
  color = "#B52117",
  count = 90,
  seed = 7,
  opacity = 0.5,
}: {
  width: number;
  height: number;
  color?: string;
  count?: number;
  seed?: number;
  opacity?: number;
}) {
  // A tiny LCG keeps the scatter identical on every render, so a card published
  // today and re-rendered next year is pixel-for-pixel the same.
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };

  // Three opacity buckets, each drawn as one path — the renderer cannot
  // serialise an array of elements inside an <svg>.
  const buckets = ["", "", ""];
  for (let i = 0; i < count; i += 1) {
    const t = rand();
    const x = rand() * width;
    // Bias grains toward the bottom, like powder that has settled.
    const y = height * (0.5 + Math.pow(rand(), 0.6) * 0.5);
    const r = 1 + t * 4.5;
    buckets[i % 3] += circlePath(x, y, r);
  }

  return (
    <svg width={width} height={height} style={{ opacity }}>
      <path d={buckets[0]} fill={color} opacity="0.9" />
      <path d={buckets[1]} fill={color} opacity="0.55" />
      <path d={buckets[2]} fill={color} opacity="0.3" />
    </svg>
  );
}

/** Layered flames licking up from a baseline. */
export function Flames({
  width,
  height,
  colors = ["#7A1F10", "#D92D20", "#F15A24", "#FFB020"],
}: {
  width: number;
  height: number;
  colors?: string[];
}) {
  const layer = (scale: number, offset: number, fill: string, opacity: number) => {
    const w = width;
    const h = height * scale;
    const y = height;
    // Five tongues of flame across the width, each a quadratic peak.
    let d = `M0 ${y}`;
    const tongues = 6;
    for (let i = 0; i < tongues; i++) {
      const x0 = (i / tongues) * w + offset;
      const x1 = ((i + 1) / tongues) * w + offset;
      const peak = y - h * (0.55 + ((i * 37) % 10) / 18);
      d += ` C${x0 + (x1 - x0) * 0.2} ${y - h * 0.2}, ${x0 + (x1 - x0) * 0.3} ${peak}, ${
        (x0 + x1) / 2
      } ${peak} C${x1 - (x1 - x0) * 0.3} ${peak}, ${x1 - (x1 - x0) * 0.2} ${
        y - h * 0.2
      }, ${x1} ${y}`;
    }
    d += ` L${w} ${y} L0 ${y} Z`;
    return <path d={d} fill={fill} opacity={opacity} />;
  };

  return (
    <svg width={width} height={height}>
      {layer(1, -width * 0.06, colors[0], 0.85)}
      {layer(0.78, width * 0.04, colors[1], 0.9)}
      {layer(0.52, -width * 0.02, colors[2], 0.95)}
      {layer(0.28, width * 0.07, colors[3], 0.9)}
    </svg>
  );
}

/** Concentric heat rings, used behind a hero number on dark themes. */
export function HeatRings({ size, color = "#F15A24" }: { size: number; color?: string }) {
  const c = size / 2;
  const w = size * 0.006;
  return (
    <svg width={size} height={size}>
      <circle cx={c} cy={c} r={c * 0.42} fill="none" stroke={color} strokeWidth={w} opacity="0.34" />
      <circle cx={c} cy={c} r={c * 0.58} fill="none" stroke={color} strokeWidth={w} opacity="0.27" />
      <circle cx={c} cy={c} r={c * 0.74} fill="none" stroke={color} strokeWidth={w} opacity="0.2" />
      <circle cx={c} cy={c} r={c * 0.92} fill="none" stroke={color} strokeWidth={w} opacity="0.13" />
    </svg>
  );
}

/** The mascot, celebrating. A fuller version of the in-app character. */
export function MascotArt({ size, cheer = true }: { size: number; cheer?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      {/* arms behind the body */}
      <g stroke="#C9271B" strokeWidth="15" strokeLinecap="round">
        {cheer ? (
          <g>
            <path d="M62 104 30 66" />
            <path d="M138 104l32-38" />
          </g>
        ) : (
          <g>
            <path d="M62 120 32 116" />
            <path d="M138 114l28-14" />
          </g>
        )}
      </g>
      {cheer ? (
        <g>
          <circle cx="26" cy="61" r="14" fill="#F2513C" />
          <circle cx="174" cy="61" r="14" fill="#F2513C" />
        </g>
      ) : (
        <g>
          <circle cx="27" cy="116" r="14" fill="#F2513C" />
          <circle cx="170" cy="98" r="15" fill="#F2513C" />
          <rect x="163" y="70" width="14" height="24" rx="7" fill="#F2513C" />
        </g>
      )}

      {/* body */}
      <path
        d="M100 34c24 0 41 20 43 47 3 38-9 69-26 92-7 10-13 15-17 15s-10-5-17-15C66 150 54 119 57 81c2-27 19-47 43-47Z"
        fill="#DE3020"
      />
      <path
        d="M112 40c12 8 19 23 20 42 3 36-8 66-24 89-3 5-6 8-8 10 8-22 15-49 15-73 0-24-1-49-3-68Z"
        fill="#A3170F"
        opacity="0.5"
      />
      <path
        d="M72 72c4-13 12-22 20-21 5 1 5 8 1 13-6 7-11 16-13 27-2 8-10 7-10-2 0-6 1-11 2-17Z"
        fill="#fff"
        opacity="0.3"
      />

      {/* calyx + stalk */}
      <path d="M78 38c13-10 33-10 45 0-13 8-32 8-45 0Z" fill="#2F6B53" />
      <path
        d="M100 36c-2-13 3-23 13-29 3-2 6 2 4 5-6 8-8 16-6 23"
        stroke="#3C9A6A"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />

      {/* sunglasses */}
      <rect x="60" y="86" width="34" height="24" rx="11" fill="#1B1B1B" />
      <rect x="106" y="86" width="34" height="24" rx="11" fill="#1B1B1B" />
      <path d="M94 95h12" stroke="#1B1B1B" strokeWidth="7" strokeLinecap="round" />
      <path d="M66 92h10" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity="0.5" />
      <path d="M112 92h10" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" opacity="0.5" />

      {/* grin */}
      <path d="M80 124q20 30 40 0a56 56 0 0 1-40 0Z" fill="#6B0F09" />
      <path d="M92 138q8 8 16 0Z" fill="#F2513C" />
    </svg>
  );
}

/** A printed-halftone texture, emitted as a single path. */
export function Halftone({
  width,
  height,
  color = "#B52117",
  gap = 26,
  radius = 3,
  opacity = 0.18,
}: {
  width: number;
  height: number;
  color?: string;
  gap?: number;
  radius?: number;
  opacity?: number;
}) {
  const cols = Math.ceil(width / gap);
  const rows = Math.ceil(height / gap);
  let d = "";
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      d += circlePath(c * gap + (r % 2 ? gap / 2 : 0), r * gap, radius);
    }
  }
  return (
    <svg width={width} height={height} style={{ opacity }}>
      <path d={d} fill={color} />
    </svg>
  );
}
