import React from "react";

/**
 * Icons for share cards, drawn as inline SVG.
 *
 * The image renderer has no emoji font, so an emoji in a card silently renders
 * as nothing. Loading a colour-emoji font would add megabytes and a per-render
 * dependency; drawing the eight glyphs we actually use keeps cards sharp at
 * 1200px, always renders, and costs nothing.
 */
export type IconName =
  | "flame"
  | "pepper"
  | "trophy"
  | "trend"
  | "calendar"
  | "target"
  | "glass"
  | "mug"
  | "bowl"
  | "shot"
  | "capsule"
  | "spoon"
  | "dots";

export function Icon({
  name,
  size,
  color,
  accent,
}: {
  name: IconName;
  size: number;
  color: string;
  accent?: string;
}) {
  const a = accent ?? color;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "flame":
      return (
        <svg {...common}>
          <path
            d="M12.6 1.4c.3 3 .1 4.6-1.6 6.6-1.5 1.8-2.1 2.6-2.4 3.7-.4-.7-.7-1.6-.7-2.6C5.6 11 4.5 13.3 4.5 15.6 4.5 19.7 7.9 23 12 23s7.5-3.3 7.5-7.4c0-5.6-4.2-8.2-6.9-14.2Z"
            fill={a}
          />
          <path
            d="M12 23c-2.2 0-4-1.8-4-4 0-2.2 1.6-3.2 2.7-5.3.9 1.2 1.4 1.8 2.4 2.7 1.6 1.4 2.9 2.2 2.9 4.1-.4 1.4-2 2.5-4 2.5Z"
            fill={color}
            opacity="0.55"
          />
        </svg>
      );

    case "pepper":
      return (
        <svg {...common}>
          <path
            d="M12 4.4c3.4 0 6 2.6 6.2 6 .2 4.2-1.2 7.6-3.2 10-1 1.2-2 1.8-3 1.8s-2-.6-3-1.8c-2-2.4-3.4-5.8-3.2-10 .2-3.4 2.8-6 6.2-6Z"
            fill={a}
          />
          <path
            d="M12 4.8c-.4-1.6.2-3 1.4-3.8.4-.2.8.2.6.6-.6 1-.8 2-.6 2.8"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );

    case "trophy":
      return (
        <svg {...common}>
          <path
            d="M7 3h10v5a5 5 0 0 1-10 0V3Z"
            fill={a}
          />
          <path
            d="M7 4.5H5a2.5 2.5 0 0 0 2.5 3M17 4.5h2a2.5 2.5 0 0 1-2.5 3"
            stroke={color}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M10 13h4v3h-4z" fill={a} />
          <path d="M7.5 21a4.5 4.5 0 0 1 9 0Z" fill={a} />
        </svg>
      );

    case "trend":
      return (
        <svg {...common}>
          <path
            d="M3 16.5 9 10l4 4 8-8"
            stroke={a}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M15 6h6v6" stroke={a} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" fill={a} />
          <path d="M8 2.5v4M16 2.5v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <rect x="6.5" y="11" width="4" height="3" rx="1" fill={color} opacity="0.55" />
        </svg>
      );

    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke={a} strokeWidth="2.2" fill="none" />
          <circle cx="12" cy="12" r="4.6" stroke={a} strokeWidth="2.2" fill="none" />
          <circle cx="12" cy="12" r="1.8" fill={a} />
        </svg>
      );

    case "glass":
      return (
        <svg {...common}>
          <path d="M6 4h12l-1.4 15a2 2 0 0 1-2 1.8h-5.2a2 2 0 0 1-2-1.8Z" fill={a} />
          <path d="M6.6 9h10.8" stroke={color} strokeWidth="1.6" opacity="0.5" />
        </svg>
      );

    case "mug":
      return (
        <svg {...common}>
          <path d="M4 7h12v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" fill={a} />
          <path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16" stroke={a} strokeWidth="2" fill="none" />
          <path d="M8 2.5c0 1.2 1 1.6 1 2.8M12 2.5c0 1.2 1 1.6 1 2.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      );

    case "bowl":
      return (
        <svg {...common}>
          <path d="M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9Z" fill={a} />
          <path d="M8 8c0-2 1.5-2.5 1.5-4M12 8c0-2 1.5-2.5 1.5-4M16 8c0-2 1.5-2.5 1.5-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" fill="none" />
        </svg>
      );

    case "shot":
      return (
        <svg {...common}>
          <path d="M7 5h10l-1 12a2 2 0 0 1-2 1.8h-4A2 2 0 0 1 8 17Z" fill={a} />
          <path d="M7.6 11h8.8" stroke={color} strokeWidth="1.8" opacity="0.55" />
        </svg>
      );

    case "capsule":
      return (
        <svg {...common}>
          <rect x="2.5" y="8" width="19" height="8" rx="4" fill={a} transform="rotate(-20 12 12)" />
          <path d="M12 6.5 8.5 16" stroke={color} strokeWidth="1.6" opacity="0.5" />
        </svg>
      );

    case "spoon":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="7" rx="5" ry="6" fill={a} />
          <path d="M12 13v8" stroke={a} strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case "dots":
      return (
        <svg {...common}>
          <circle cx="5" cy="12" r="2.2" fill={a} />
          <circle cx="12" cy="12" r="2.2" fill={a} />
          <circle cx="19" cy="12" r="2.2" fill={a} />
        </svg>
      );
  }
}

/** Method enum → icon, so cards never depend on the emoji in METHOD_META. */
export const METHOD_ICON: Record<string, IconName> = {
  WATER: "glass",
  TEA: "mug",
  FOOD: "bowl",
  SHOT: "shot",
  CAPSULE: "capsule",
  OTHER: "dots",
};
