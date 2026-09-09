import React from "react";

import { Flames, Halftone, MascotArt, Pepper, PowderField } from "@/lib/share/art";
import { Icon } from "@/lib/share/icons";
import { THEMES, type Theme } from "@/lib/share/themes";
import type { CardSpec, ThemeId } from "@/lib/share/types";

/**
 * Renders a card spec into JSX for the image renderer.
 *
 * Two independent axes. `Chrome` is the theme: background, decoration, brand
 * mark and lockup. `Shape` is the card type: a streak leads with a number, a
 * journey with a rail between dates, a pep talk with nothing but the line. Seven
 * shapes and six themes compose rather than multiply.
 *
 * Everything is sized against one constraint: a 1200px card renders at roughly
 * 350px in a mobile Facebook feed, so nothing that matters is below ~34px here
 * (≈10px there) and the hero is enormous.
 *
 * Renderer limits worth remembering: flex only, no blur, radial gradients are
 * unreliable, and neither arrays of elements nor fragments survive inside <svg>.
 */
export function renderCard(
  spec: CardSpec,
  themeId: ThemeId,
  output: { width: number; height: number },
  /** A data URI, present only when the user attached their own photo. */
  photo?: string | null,
) {
  const theme = THEMES[themeId];
  const u = output.width / 1200;
  const ctx: Ctx = {
    spec,
    theme,
    width: output.width,
    height: output.height,
    u,
    photo: photo ?? null,
  };

  // Without a photo the photo template has nothing to be, so it falls back
  // rather than exporting a black rectangle.
  if (theme.chrome === "photo") {
    return ctx.photo ? <PhotoChrome {...ctx} /> : <StandardChrome {...ctx} theme={THEMES.SIGNATURE} />;
  }
  if (theme.chrome === "facebook") return <FacebookChrome {...ctx} />;
  if (theme.chrome === "minimal") return <MinimalChrome {...ctx} />;
  return <StandardChrome {...ctx} />;
}

type Ctx = {
  spec: CardSpec;
  theme: Theme;
  width: number;
  height: number;
  u: number;
  photo?: string | null;
};

// ----------------------------------------------------------------- pieces --

/** The number, as large as the card can bear. It is the whole point. */
function Hero({ value, u, color }: { value: string; u: number; color: string }) {
  const size =
    value.length <= 2 ? 460 : value.length <= 3 ? 360 : value.length <= 5 ? 250 : 180;
  return (
    <div
      style={{
        display: "flex",
        fontSize: size * u,
        fontWeight: 900,
        lineHeight: 0.84,
        letterSpacing: -9 * u,
        color,
      }}
    >
      {value}
    </div>
  );
}

function Unit({ text, u, color, width }: { text: string; u: number; color: string; width: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: (text.length > 20 ? 44 : 56) * u,
        fontWeight: 900,
        letterSpacing: 5 * u,
        color,
        textAlign: "center",
        maxWidth: width,
        lineHeight: 1.1,
      }}
    >
      {text}
    </div>
  );
}

/** The human line. Second only to the number, and never below 40px. */
function Voice({
  text,
  u,
  color,
  width,
  align = "center",
}: {
  text: string;
  u: number;
  color: string;
  width: number;
  align?: "center" | "left";
}) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: (text.length > 52 ? 44 : 52) * u,
        fontWeight: 800,
        lineHeight: 1.22,
        color,
        maxWidth: width,
        textAlign: align,
      }}
    >
      {text}
    </div>
  );
}

/**
 * At most two supporting numbers, set large enough to survive the feed. Labels
 * are 30px here — about 9px at thumbnail size — which is the floor for anything
 * worth printing at all.
 */
function Stats({ spec, theme, u }: Ctx) {
  if (!spec.stats.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {spec.stats.slice(0, 2).map((stat, i) => (
        <div key={stat.label} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 ? (
            <div
              style={{
                display: "flex",
                width: 3 * u,
                height: 66 * u,
                background: theme.rule,
                margin: `0 ${44 * u}px`,
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12 * u,
                fontSize: 64 * u,
                fontWeight: 900,
                color: theme.ink,
              }}
            >
              <Icon name={stat.icon} size={46 * u} color={theme.ink} accent={theme.accent} />
              {stat.value}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 34 * u,
                fontWeight: 800,
                letterSpacing: 2.4 * u,
                color: theme.inkSoft,
              }}
            >
              {stat.label.toUpperCase()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Journey's rail: two dates with a line between them. */
function Rail({ spec, theme, u, width }: Ctx) {
  if (!spec.rail) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 * u, maxWidth: width - 200 * u }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 26 * u, fontWeight: 800, letterSpacing: 3 * u, color: theme.inkSoft }}>
          STARTED
        </div>
        <div style={{ display: "flex", fontSize: 40 * u, fontWeight: 900, color: theme.ink }}>
          {spec.rail.from}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 * u }}>
        <div style={{ display: "flex", width: 90 * u, height: 4 * u, background: theme.rule }} />
        <Pepper size={54 * u} rotate={90} {...theme.pepper} />
        <div style={{ display: "flex", width: 90 * u, height: 4 * u, background: theme.rule }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 26 * u, fontWeight: 800, letterSpacing: 3 * u, color: theme.accent }}>
          STILL GOING
        </div>
        <div style={{ display: "flex", fontSize: 40 * u, fontWeight: 900, color: theme.ink }}>
          {spec.rail.to}
        </div>
      </div>
    </div>
  );
}

function Ring({ spec, theme, u }: Ctx) {
  if (!spec.ring) return null;
  const size = 420 * u;
  const stroke = 34 * u;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={theme.rule} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, spec.ring.percent / 100))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 150 * u, fontWeight: 900, color: theme.hero, lineHeight: 0.9 }}>
          {spec.ring.percent}%
        </div>
      </div>
    </div>
  );
}

/** The brand block. Sized so it is plainly readable in a feed. */
function Lockup({ theme, u, align = "center" }: { theme: Theme; u: number; align?: "center" | "left" }) {
  const items = align === "left" ? "flex-start" : "center";

  if (theme.lockup === "tracked") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 8 * u }}>
        <div style={{ display: "flex", fontSize: 30 * u, fontWeight: 800, letterSpacing: 3 * u, color: theme.inkSoft }}>
          TRACKED WITH
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 * u }}>
          <Pepper size={62 * u} rotate={-16} {...theme.pepper} />
          <div style={{ display: "flex", fontSize: 66 * u, fontWeight: 900, color: theme.ink, letterSpacing: -2 * u }}>
            Cayenne Do It
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 8 * u }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 * u }}>
        <Pepper size={72 * u} rotate={-16} {...theme.pepper} />
        <div style={{ display: "flex", fontSize: 74 * u, fontWeight: 900, color: theme.ink, letterSpacing: -2.5 * u }}>
          Cayenne Do It
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 32 * u, fontWeight: 800, letterSpacing: 6 * u, color: theme.accent }}>
        SMALL HABIT. BIG FIRE.
      </div>
    </div>
  );
}

function BrandMark({ theme, u }: { theme: Theme; u: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 * u }}>
      <Pepper size={44 * u} rotate={-14} {...theme.pepper} />
      <div style={{ display: "flex", fontSize: 32 * u, fontWeight: 900, letterSpacing: 7 * u, color: theme.inkSoft }}>
        CAYENNE DO IT
      </div>
    </div>
  );
}

function Layer({ children, ...pos }: { children: React.ReactNode } & React.CSSProperties) {
  return <div style={{ position: "absolute", display: "flex", ...pos }}>{children}</div>;
}

// ----------------------------------------------------------------- shapes --

/**
 * The content of the card, chosen by type. `align` lets the minimal chrome run
 * the same shapes left-aligned without duplicating any of them.
 */
function Shape(ctx: Ctx & { align?: "center" | "left"; voiceShown?: boolean }) {
  const { spec, theme, width, u } = ctx;
  const align = ctx.align ?? "center";
  const items = align === "left" ? "flex-start" : "center";
  const gap = 26 * u;

  const eyebrow = spec.eyebrow ? (
    <div style={{ display: "flex", fontSize: 38 * u, fontWeight: 900, letterSpacing: 4 * u, color: theme.accent }}>
      {spec.eyebrow}
    </div>
  ) : null;

  const voice = ctx.voiceShown ? null : (
    <Voice text={spec.voice} u={u} color={theme.ink} width={width - 190 * u} align={align} />
  );

  // A pep talk is only the line — set as the hero, at hero scale.
  if (spec.kind === "PEP_TALK") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 40 * u, textAlign: align }}>
        <div
          style={{
            display: "flex",
            fontSize: ((spec.heroTitle ?? "").length > 44 ? 82 : 104) * u,
            fontWeight: 900,
            lineHeight: 1.06,
            letterSpacing: -2 * u,
            color: theme.hero,
            maxWidth: width - 170 * u,
          }}
        >
          &ldquo;{spec.heroTitle}&rdquo;
        </div>
        <div style={{ display: "flex", width: 140 * u, height: 6 * u, background: theme.accent, borderRadius: 6 * u }} />
        {voice}
      </div>
    );
  }

  // The ring is the shape for a challenge; the day count sits under it.
  if (spec.kind === "CHALLENGE") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap }}>
        {eyebrow}
        <Ring {...ctx} />
        {spec.heroUnit ? <Unit text={spec.heroUnit} u={u} color={theme.accent} width={width - 190 * u} /> : null}
        {voice}
      </div>
    );
  }

  // The mascot carries an achievement — it's the moment that earns the character.
  if (spec.kind === "ACHIEVEMENT") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 20 * u }}>
        {eyebrow}
        <div style={{ display: "flex", alignItems: "center", gap: 20 * u }}>
          {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
          <MascotArt size={330 * u} />
        </div>
        {spec.heroUnit ? <Unit text={spec.heroUnit} u={u} color={theme.accent} width={width - 190 * u} /> : null}
        {spec.heroTitle ? (
          <div style={{ display: "flex", fontSize: 92 * u, fontWeight: 900, color: theme.hero, textAlign: align }}>
            {spec.heroTitle}
          </div>
        ) : null}
        {voice}
      </div>
    );
  }

  // Month name as hero, ratio beneath.
  if (spec.kind === "MONTHLY_RECAP") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 18 * u }}>
        {eyebrow}
        <div style={{ display: "flex", fontSize: 200 * u, fontWeight: 900, lineHeight: 0.9, letterSpacing: -6 * u, color: theme.hero }}>
          {spec.heroTitle}
        </div>
        {spec.heroUnit ? <Unit text={spec.heroUnit} u={u} color={theme.accent} width={width - 190 * u} /> : null}
        <div style={{ display: "flex", marginTop: 14 * u }}>{voice}</div>
      </div>
    );
  }

  // Journey: number, then the rail between two dates.
  if (spec.kind === "JOURNEY") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 22 * u }}>
        {eyebrow}
        {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
        {spec.heroUnit ? <Unit text={spec.heroUnit} u={u} color={theme.accent} width={width - 190 * u} /> : null}
        {spec.rail ? (
          <div style={{ display: "flex", marginTop: 18 * u }}>
            <Rail {...ctx} />
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: 12 * u }}>{voice}</div>
      </div>
    );
  }

  // Streak and progress: the number, its unit, the line.
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 22 * u }}>
      {eyebrow}
      {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
      {spec.heroUnit ? <Unit text={spec.heroUnit} u={u} color={theme.accent} width={width - 190 * u} /> : null}
      <div style={{ display: "flex", marginTop: 16 * u }}>{voice}</div>
    </div>
  );
}

// ----------------------------------------------------------------- chrome --

function Decor({ theme, width, height, u }: Ctx) {
  switch (theme.decor) {
    case "peppersCorner":
      return (
        <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex" }}>
          <Layer top={0} left={0} width={width} height={height}>
            <Halftone width={width} height={height} color={theme.accent} gap={32 * u} radius={3 * u} opacity={0.08} />
          </Layer>
          <Layer top={height * 0.14} left={-52 * u}>
            <Pepper size={360 * u} rotate={28} {...theme.pepper} opacity={0.5} />
          </Layer>
          <Layer top={height * 0.62} left={width - 120 * u}>
            <Pepper size={320 * u} rotate={-152} {...theme.pepper} opacity={0.42} />
          </Layer>
        </div>
      );
    case "fire":
      return (
        <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex" }}>
          <Layer top={height * 0.2} left={0} width={width} height={height * 0.4}>
            <div
              style={{
                display: "flex",
                width,
                height: height * 0.4,
                background:
                  "linear-gradient(180deg, rgba(217,45,32,0) 0%, rgba(241,90,36,0.32) 45%, rgba(217,45,32,0) 100%)",
              }}
            />
          </Layer>
          <Layer bottom={0} left={0} width={width} height={height * 0.28}>
            <PowderField width={width} height={height * 0.28} color="#F15A24" count={160} opacity={0.5} seed={31} />
          </Layer>
          <Layer bottom={0} left={0} width={width} height={height * 0.05}>
            <Flames width={width} height={height * 0.05} colors={["#4A1208", "#7A1F10", "#B52117", "#D9450F"]} />
          </Layer>
          <Layer top={-30 * u} left={width - 118 * u}>
            <Pepper size={290 * u} rotate={-158} {...theme.pepper} opacity={0.8} />
          </Layer>
        </div>
      );
    case "harvest":
      return (
        <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex" }}>
          <Layer bottom={0} left={0} width={width} height={height * 0.6}>
            <PowderField width={width} height={height * 0.6} color={theme.accent} count={220} opacity={0.5} />
          </Layer>
          <Layer top={-38 * u} left={-56 * u}>
            <Pepper size={300 * u} rotate={38} {...theme.pepper} />
          </Layer>
          <Layer top={34 * u} left={width - 150 * u}>
            <Pepper size={250 * u} rotate={-32} {...theme.pepper} />
          </Layer>
        </div>
      );
    case "confetti":
      return (
        <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex" }}>
          <Layer top={0} left={0} width={width} height={height}>
            <Halftone width={width} height={height} color="#D92D20" gap={36 * u} radius={4 * u} opacity={0.07} />
          </Layer>
          <Layer top={height * 0.08} left={-46 * u}>
            <Pepper size={240 * u} rotate={34} {...theme.pepper} opacity={0.5} />
          </Layer>
        </div>
      );
    default:
      return null;
  }
}

/** Centred: brand mark, shape, stats, lockup. */
function StandardChrome(ctx: Ctx) {
  const { theme, u, width } = ctx;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${62 * u}px ${80 * u}px`,
        background: theme.background,
        fontFamily: "Nunito",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Decor {...ctx} />
      <div style={{ position: "relative", display: "flex" }}>
        <BrandMark theme={theme} u={u} />
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 28 * u,
          paddingBottom: 28 * u,
          width: width - 160 * u,
        }}
      >
        <Shape {...ctx} />
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 36 * u }}>
        <Stats {...ctx} />
        <Lockup theme={theme} u={u} />
      </div>
    </div>
  );
}

/** Left-aligned, editorial, one pepper. */
function MinimalChrome(ctx: Ctx) {
  const { theme, u, width } = ctx;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${80 * u}px ${84 * u}px`,
        background: theme.background,
        fontFamily: "Nunito",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Layer top={70 * u} left={width - 128 * u}>
        <Pepper size={210 * u} rotate={-18} {...theme.pepper} />
      </Layer>

      <div style={{ display: "flex", fontSize: 32 * u, fontWeight: 900, letterSpacing: 7 * u, color: theme.inkSoft }}>
        CAYENNE DO IT
      </div>

      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
        <Shape {...ctx} align="left" />
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
        <Lockup theme={theme} u={u} align="left" />
        <Stats {...ctx} />
      </div>
    </div>
  );
}

/**
 * The user's own photo, full bleed.
 *
 * The photo is the card here — the numbers sit in a scrim along the bottom
 * rather than competing with it, and the line is set over the image itself. A
 * dark band runs the full width so white text stays legible over a photo of any
 * brightness, which cannot be assumed.
 */
function PhotoChrome(ctx: Ctx) {
  const { spec, theme, width, height, u, photo } = ctx;
  const scrim = Math.round(height * 0.44);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: theme.background,
        fontFamily: "Nunito",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo ?? ""}
        alt=""
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover" }}
      />

      {/* Two flat bands rather than one gradient: gradients over a photo render
          inconsistently, and legibility is not worth the risk. */}
      <div
        style={{
          position: "absolute",
          top: height - scrim,
          left: 0,
          width,
          height: scrim,
          display: "flex",
          background:
            "linear-gradient(180deg,rgba(10,8,6,0) 0%,rgba(10,8,6,0.55) 34%,rgba(10,8,6,0.86) 68%,rgba(10,8,6,0.93) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height: 200 * u,
          display: "flex",
          background: "linear-gradient(180deg,rgba(10,8,6,0.62) 0%,rgba(10,8,6,0) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 54 * u,
          left: 64 * u,
          display: "flex",
          alignItems: "center",
          gap: 14 * u,
        }}
      >
        <Pepper size={46 * u} rotate={-14} {...theme.pepper} />
        <div
          style={{
            display: "flex",
            fontSize: 32 * u,
            fontWeight: 900,
            letterSpacing: 7 * u,
            color: "#FFF7E8",
          }}
        >
          CAYENNE DO IT
        </div>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 26 * u,
          padding: `0 ${64 * u}px ${58 * u}px`,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 24 * u }}>
          {spec.heroValue ? (
            <div
              style={{
                display: "flex",
                fontSize: 230 * u,
                fontWeight: 900,
                lineHeight: 0.82,
                letterSpacing: -8 * u,
                color: "#FFF7E8",
              }}
            >
              {spec.heroValue}
            </div>
          ) : null}
          {spec.heroUnit ? (
            <div
              style={{
                display: "flex",
                fontSize: 46 * u,
                fontWeight: 900,
                letterSpacing: 3 * u,
                color: theme.accent,
                paddingBottom: 18 * u,
                maxWidth: width - 380 * u,
              }}
            >
              {spec.heroUnit}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: (spec.voice.length > 52 ? 48 : 56) * u,
            fontWeight: 900,
            lineHeight: 1.14,
            color: "#FFF7E8",
            maxWidth: width - 128 * u,
          }}
        >
          {spec.voice}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: 10 * u,
          }}
        >
          {spec.rail ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 * u }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 26 * u,
                  fontWeight: 800,
                  letterSpacing: 3 * u,
                  color: "rgba(255,247,232,0.7)",
                }}
              >
                {spec.rail.from.toUpperCase()} — TODAY
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 30 * u,
                  fontWeight: 800,
                  letterSpacing: 4 * u,
                  color: theme.accent,
                }}
              >
                SMALL HABIT. BIG FIRE.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
          <Stats {...ctx} />
        </div>
      </div>
    </div>
  );
}

/** Banded: the line leads in red, the shape sits below, the lockup gets a bar. */
function FacebookChrome(ctx: Ctx) {
  const { spec, theme, width, height, u } = ctx;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.background,
        fontFamily: "Nunito",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: `${46 * u}px ${76 * u}px ${50 * u}px`,
          background: "linear-gradient(120deg,#D92D20 0%,#F15A24 100%)",
          position: "relative",
        }}
      >
        <Layer top={-40 * u} left={width - 116 * u}>
          <Pepper size={210 * u} rotate={-150} body="#A3170F" shade="#7A1F10" stem="#2F6B53" opacity={0.5} />
        </Layer>
        <div
          style={{
            display: "flex",
            fontSize: (spec.voice.length > 52 ? 52 : 60) * u,
            fontWeight: 900,
            lineHeight: 1.14,
            color: "#FFF7E8",
            textAlign: "center",
            maxWidth: width - 180 * u,
            position: "relative",
          }}
        >
          {spec.voice}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          width: "100%",
          position: "relative",
          padding: `${26 * u}px ${76 * u}px`,
        }}
      >
        <Layer bottom={0} left={0} width={width} height={height * 0.26}>
          <PowderField width={width} height={height * 0.26} color="#F15A24" count={190} opacity={0.55} seed={19} />
        </Layer>
        <Layer top={height * 0.02} left={-44 * u}>
          <Pepper size={280 * u} rotate={32} {...theme.pepper} opacity={0.75} />
        </Layer>

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 34 * u }}>
          <Shape {...ctx} voiceShown />
          <Stats {...ctx} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8 * u,
          width: "100%",
          padding: `${36 * u}px 0 ${40 * u}px`,
          background: "rgba(255,247,232,0.06)",
          borderTop: `${3 * u}px solid rgba(255,247,232,0.16)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 * u }}>
          <div style={{ display: "flex", fontSize: 32 * u, fontWeight: 800, letterSpacing: 2 * u, color: theme.inkSoft }}>
            TRACKED WITH
          </div>
          <Pepper size={62 * u} rotate={-16} {...theme.pepper} />
          <div style={{ display: "flex", fontSize: 66 * u, fontWeight: 900, color: theme.ink, letterSpacing: -2 * u }}>
            Cayenne Do It
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30 * u, fontWeight: 800, letterSpacing: 5 * u, color: theme.accent }}>
          SMALL HABIT. BIG FIRE.
        </div>
      </div>
    </div>
  );
}
