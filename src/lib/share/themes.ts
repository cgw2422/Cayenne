import type { ThemeId } from "@/lib/share/types";

/**
 * A theme is a palette plus a few structural switches. Every card type renders
 * through the same slot layout, so adding a seventh theme means adding one
 * object here — no new render code.
 */
export type Theme = {
  id: ThemeId;
  /** CSS background for the card surface. Linear gradients only — radial ones
   *  render unpredictably in the image renderer. */
  background: string;
  /** Optional wash layered over the top third, for depth. */
  wash: string | null;
  ink: string;
  inkSoft: string;
  accent: string;
  accentSoft: string;
  /** Hero number colour — usually accent, but inverted on dark themes. */
  hero: string;
  chipBg: string;
  chipBorder: string;
  chipInk: string;
  chipValue: string;
  quoteInk: string;
  rule: string;
  /** `tracked` is the understated Strava-style line; `block` is the wordmark. */
  footer: "tracked" | "block";
  /** Decoration behind the hero. Kept deliberately sparse — the renderer has no
   *  blur, so scattered specks read as dust rather than atmosphere. */
  decoration: "none" | "confetti" | "grain";
  /** Colour for the decoration, which is rarely the same as the accent. */
  decorationColor: string;
  showDomain: boolean;
};

export const THEMES: Record<ThemeId, Theme> = {
  // Warm cream, cayenne red, brand-forward. The house style.
  SIGNATURE: {
    id: "SIGNATURE",
    background: "linear-gradient(170deg,#FFFDF8 0%,#FFF7E8 55%,#F8ECD6 100%)",
    wash: null,
    ink: "#202020",
    inkSoft: "#6B6660",
    accent: "#D92D20",
    accentSoft: "#F15A24",
    hero: "#D92D20",
    chipBg: "#FFFFFF",
    chipBorder: "#EDDFC4",
    chipInk: "#6B6660",
    chipValue: "#202020",
    quoteInk: "#3D3A36",
    rule: "#EDDFC4",
    footer: "block",
    decoration: "none",
    decorationColor: "transparent",
    showDomain: false,
  },

  // Dark, dramatic, built around an enormous glowing number.
  ON_FIRE: {
    id: "ON_FIRE",
    background: "linear-gradient(168deg,#2A0F0A 0%,#1A1512 42%,#202020 100%)",
    wash:
      "linear-gradient(180deg, rgba(241,90,36,0.34) 0%, rgba(217,45,32,0.10) 55%, rgba(32,32,32,0) 100%)",
    ink: "#FFF7E8",
    inkSoft: "rgba(255,247,232,0.62)",
    accent: "#FF8A4C",
    accentSoft: "#FFB020",
    hero: "#FFF7E8",
    chipBg: "rgba(255,247,232,0.08)",
    chipBorder: "rgba(255,247,232,0.16)",
    chipInk: "rgba(255,247,232,0.58)",
    chipValue: "#FFF7E8",
    quoteInk: "rgba(255,247,232,0.76)",
    rule: "rgba(255,247,232,0.14)",
    footer: "block",
    decoration: "none",
    decorationColor: "transparent",
    showDomain: false,
  },

  // Earthy, rustic-but-modern. Deep pepper green and warm clay.
  PEPPER_COUNTRY: {
    id: "PEPPER_COUNTRY",
    background: "linear-gradient(165deg,#F4E7D0 0%,#E8D5B5 48%,#D9BE95 100%)",
    wash: "linear-gradient(180deg, rgba(18,55,42,0.10) 0%, rgba(18,55,42,0) 60%)",
    ink: "#12372A",
    inkSoft: "#5A6B5C",
    accent: "#B52117",
    accentSoft: "#D9450F",
    hero: "#12372A",
    chipBg: "rgba(255,253,248,0.72)",
    chipBorder: "rgba(18,55,42,0.16)",
    chipInk: "#5A6B5C",
    chipValue: "#12372A",
    quoteInk: "#3A4A3C",
    rule: "rgba(18,55,42,0.18)",
    footer: "block",
    decoration: "grain",
    decorationColor: "#B52117",
    showDomain: true,
  },

  // Almost all white, enormous type, nothing else.
  MINIMAL: {
    id: "MINIMAL",
    background: "linear-gradient(180deg,#FFFFFF 0%,#FFFDF8 100%)",
    wash: null,
    ink: "#202020",
    inkSoft: "#8A857E",
    accent: "#D92D20",
    accentSoft: "#D92D20",
    hero: "#202020",
    chipBg: "transparent",
    chipBorder: "transparent",
    chipInk: "#8A857E",
    chipValue: "#202020",
    quoteInk: "#6B6660",
    rule: "#EFE9DE",
    footer: "tracked",
    decoration: "none",
    decorationColor: "transparent",
    showDomain: false,
  },

  // For achievements and milestones. Confetti, warmth, a sense of occasion.
  CELEBRATION: {
    id: "CELEBRATION",
    background: "linear-gradient(160deg,#D92D20 0%,#F15A24 38%,#FFB020 100%)",
    wash: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 45%)",
    ink: "#FFFDF8",
    inkSoft: "rgba(255,253,248,0.78)",
    accent: "#FFFDF8",
    accentSoft: "#12372A",
    hero: "#FFFDF8",
    chipBg: "rgba(255,253,248,0.16)",
    chipBorder: "rgba(255,253,248,0.30)",
    chipInk: "rgba(255,253,248,0.80)",
    chipValue: "#FFFDF8",
    quoteInk: "rgba(255,253,248,0.88)",
    rule: "rgba(255,253,248,0.28)",
    footer: "block",
    decoration: "confetti",
    decorationColor: "#FFFDF8",
    showDomain: false,
  },

  // Tuned for a Facebook feed: deep green, high contrast, "Tracked with" line.
  SOCIAL: {
    id: "SOCIAL",
    background: "linear-gradient(168deg,#22664E 0%,#14402F 46%,#08190F 100%)",
    // No warm wash here: orange over deep green renders khaki, not heat.
    wash: null,
    ink: "#FFF7E8",
    inkSoft: "rgba(255,247,232,0.60)",
    accent: "#FF8A4C",
    accentSoft: "#FFB020",
    hero: "#FFF7E8",
    chipBg: "rgba(255,247,232,0.09)",
    chipBorder: "rgba(255,247,232,0.16)",
    chipInk: "rgba(255,247,232,0.56)",
    chipValue: "#FFF7E8",
    quoteInk: "rgba(255,247,232,0.74)",
    rule: "rgba(255,247,232,0.14)",
    footer: "tracked",
    decoration: "none",
    decorationColor: "transparent",
    showDomain: true,
  },
};

/** The theme that suits each card type best, used as the initial selection. */
export function defaultThemeFor(kind: string): ThemeId {
  if (kind === "ACHIEVEMENT") return "CELEBRATION";
  if (kind === "HOT_STREAK") return "ON_FIRE";
  if (kind === "PEP_TALK") return "MINIMAL";
  if (kind === "MONTHLY_RECAP") return "PEPPER_COUNTRY";
  return "SIGNATURE";
}
