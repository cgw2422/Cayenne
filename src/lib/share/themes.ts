import type { ThemeId } from "@/lib/share/types";

/**
 * A theme is a palette plus a layout choice. Each `layout` is a genuinely
 * different composition — not the same stack with a new background — so someone
 * scrolling past several of these over time starts to recognise the brand
 * rather than seeing six recolours of one card.
 */
export type Theme = {
  id: ThemeId;
  /** Which frame the card sits in. */
  chrome: "standard" | "minimal" | "facebook" | "photo";
  /** Which illustration set decorates it. */
  decor: "peppersCorner" | "fire" | "harvest" | "confetti" | "none";
  background: string;
  ink: string;
  inkSoft: string;
  accent: string;
  accentSoft: string;
  hero: string;
  rule: string;
  /** Pepper illustration colours, tuned per background. */
  pepper: { body: string; shade: string; stem: string };
  /** `tracked` is the understated line; `lockup` is the full brand block. */
  lockup: "tracked" | "lockup";
};

export const THEMES: Record<ThemeId, Theme> = {
  // Cream and cayenne red, with an illustrated pepper anchoring the number.
  SIGNATURE: {
    id: "SIGNATURE",
    chrome: "standard",
    decor: "peppersCorner",
    background: "linear-gradient(168deg,#FFFDF8 0%,#FFF7E8 58%,#F6E8CE 100%)",
    ink: "#202020",
    inkSoft: "#6B6660",
    accent: "#D92D20",
    accentSoft: "#F15A24",
    hero: "#D92D20",
    rule: "#E7D8BB",
    pepper: { body: "#D92D20", shade: "#A3170F", stem: "#2F6B53" },
    lockup: "lockup",
  },

  // Dark and dramatic: heat rings behind the number, flames along the base.
  ON_FIRE: {
    id: "ON_FIRE",
    chrome: "standard",
    decor: "fire",
    background: "linear-gradient(172deg,#231007 0%,#180D08 48%,#120A06 100%)",
    ink: "#FFF7E8",
    inkSoft: "rgba(255,247,232,0.62)",
    accent: "#FF8A4C",
    accentSoft: "#FFB020",
    hero: "#FFF7E8",
    rule: "rgba(255,247,232,0.16)",
    pepper: { body: "#FF6A45", shade: "#C9271B", stem: "#4CB07C" },
    lockup: "lockup",
  },

  // Natural and editorial: whole peppers and a drift of ground cayenne.
  FRESH_CAYENNE: {
    id: "FRESH_CAYENNE",
    chrome: "standard",
    decor: "harvest",
    background: "linear-gradient(168deg,#F6EBD8 0%,#EFDDC0 52%,#E3CBA4 100%)",
    ink: "#12372A",
    inkSoft: "#5E6B57",
    accent: "#B52117",
    accentSoft: "#D9450F",
    hero: "#12372A",
    rule: "rgba(18,55,42,0.22)",
    pepper: { body: "#C62A18", shade: "#8E1A0E", stem: "#2F6B53" },
    lockup: "lockup",
  },

  // The character carries it: mascot beside the number, speech bubble, confetti.
  MASCOT: {
    id: "MASCOT",
    chrome: "standard",
    decor: "confetti",
    background: "linear-gradient(160deg,#FFF3D8 0%,#FFE0B8 55%,#FFCE95 100%)",
    ink: "#202020",
    inkSoft: "#7A6A55",
    accent: "#D92D20",
    accentSoft: "#F15A24",
    hero: "#D92D20",
    rule: "rgba(32,32,32,0.14)",
    pepper: { body: "#DE3020", shade: "#A3170F", stem: "#2F6B53" },
    lockup: "lockup",
  },

  // Enormous type, left-aligned, almost nothing else.
  MINIMAL: {
    id: "MINIMAL",
    chrome: "minimal",
    decor: "none",
    background: "linear-gradient(180deg,#FFFFFF 0%,#FFFCF5 100%)",
    ink: "#181818",
    inkSoft: "#8A857E",
    accent: "#D92D20",
    accentSoft: "#D92D20",
    hero: "#181818",
    rule: "#ECE5D8",
    pepper: { body: "#D92D20", shade: "#A3170F", stem: "#2F6B53" },
    lockup: "tracked",
  },

  // Built to stop a thumb: the voice line leads, in a red band, above the number.
  FACEBOOK: {
    id: "FACEBOOK",
    chrome: "facebook",
    decor: "none",
    background: "linear-gradient(178deg,#14402F 0%,#0E2E22 62%,#081A12 100%)",
    ink: "#FFF7E8",
    inkSoft: "rgba(255,247,232,0.66)",
    accent: "#FFB020",
    accentSoft: "#F15A24",
    hero: "#FFF7E8",
    rule: "rgba(255,247,232,0.18)",
    pepper: { body: "#FF6A45", shade: "#C9271B", stem: "#4CB07C" },
    lockup: "tracked",
  },

  // The user's own photo, full bleed, with the numbers set into a scrim along
  // the bottom. Only offered once they've actually attached one.
  PHOTO: {
    id: "PHOTO",
    chrome: "photo",
    decor: "none",
    background: "#12100E",
    ink: "#FFF7E8",
    inkSoft: "rgba(255,247,232,0.74)",
    accent: "#FFB020",
    accentSoft: "#F15A24",
    hero: "#FFF7E8",
    rule: "rgba(255,247,232,0.24)",
    pepper: { body: "#FF6A45", shade: "#C9271B", stem: "#4CB07C" },
    lockup: "tracked",
  },
};

/** The theme that suits each card type best, used as the initial selection. */
export function defaultThemeFor(kind: string): ThemeId {
  if (kind === "ACHIEVEMENT") return "MASCOT";
  if (kind === "HOT_STREAK") return "FACEBOOK";
  if (kind === "PEP_TALK") return "MINIMAL";
  if (kind === "MONTHLY_RECAP") return "FRESH_CAYENNE";
  if (kind === "CHALLENGE") return "ON_FIRE";
  return "SIGNATURE";
}
