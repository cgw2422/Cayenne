import React from "react";

import { Flames, Halftone, MascotArt, Pepper, PowderField } from "@/lib/share/art";
import { Icon, type IconName } from "@/lib/share/icons";
import { THEMES, type Theme } from "@/lib/share/themes";
import type { CardSpec, ThemeId } from "@/lib/share/types";

/**
 * Renders a card spec into JSX for the image renderer.
 *
 * Each theme has its own composition rather than sharing one stack, so the six
 * templates are genuinely different graphics. What they share is the vocabulary:
 * pepper illustration, the hero number, the voice line, and the brand lockup —
 * which is what makes them recognisable as a set.
 *
 * Renderer constraints worth remembering: flex only, every element with more
 * than one child needs an explicit display, no blur, and radial gradients are
 * unreliable — depth comes from layered shapes and linear washes.
 */
export function renderCard(
  spec: CardSpec,
  themeId: ThemeId,
  output: { width: number; height: number },
) {
  const theme = THEMES[themeId];
  const { width, height } = output;
  // Every dimension derives from the actual output width, so a half-scale
  // preview is a faithful miniature rather than a cramped full-size layout.
  const u = width / 1200;
  const ctx = { spec, theme, width, height, u };

  switch (theme.layout) {
    case "onFire":
      return <OnFire {...ctx} />;
    case "fresh":
      return <Fresh {...ctx} />;
    case "mascot":
      return <MascotLayout {...ctx} />;
    case "minimal":
      return <Minimal {...ctx} />;
    case "facebook":
      return <Facebook {...ctx} />;
    default:
      return <Signature {...ctx} />;
  }
}

type Ctx = {
  spec: CardSpec;
  theme: Theme;
  width: number;
  height: number;
  u: number;
};

// ---------------------------------------------------------------- surface --

function Surface({
  theme,
  children,
  padX,
  padY,
}: Ctx & { children: React.ReactNode; padX: number; padY: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${padY}px ${padX}px`,
        background: theme.background,
        fontFamily: "Nunito",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ parts --

/** Hero number, sized so it lands in a feed before anything else is read. */
function Hero({
  value,
  u,
  color,
  max,
}: {
  value: string;
  u: number;
  color: string;
  max?: number;
}) {
  const size =
    value.length <= 2
      ? 440
      : value.length <= 3
        ? 340
        : value.length <= 7
          ? 190
          : value.length <= 11
            ? 130
            : 104;
  return (
    <div
      style={{
        display: "flex",
        fontSize: Math.min(size, max ?? size) * u,
        fontWeight: 900,
        lineHeight: 0.86,
        letterSpacing: -8 * u,
        color,
      }}
    >
      {value}
    </div>
  );
}

function Unit({ text, u, color, size = 46 }: { text: string; u: number; color: string; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: (text.length > 18 ? size * 0.76 : size) * u,
        fontWeight: 900,
        letterSpacing: 5 * u,
        color,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

/** The line with personality — the thing someone actually stops to read. */
function Voice({
  text,
  u,
  color,
  width,
  size = 40,
}: {
  text: string;
  u: number;
  color: string;
  width: number;
  size?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: (text.length > 62 ? size * 0.82 : size) * u,
        fontWeight: 800,
        lineHeight: 1.24,
        color,
        maxWidth: width,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

/** Stats as an inline run with hairline dividers — lighter than boxed chips. */
function StatRun({
  stats,
  u,
  ink,
  soft,
  accent,
  rule,
}: {
  stats: CardSpec["stats"];
  u: number;
  ink: string;
  soft: string;
  accent: string;
  rule: string;
}) {
  if (!stats.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {stats.slice(0, 3).map((stat, i) => (
        <div key={stat.label} style={{ display: "flex", alignItems: "center" }}>
          {i > 0 ? (
            <div
              style={{
                display: "flex",
                width: 2 * u,
                height: 54 * u,
                background: rule,
                margin: `0 ${34 * u}px`,
              }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                fontSize: 50 * u,
                fontWeight: 900,
                color: ink,
              }}
            >
              <Icon name={stat.icon as IconName} size={36 * u} color={ink} accent={accent} />
              {stat.value}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20 * u,
                fontWeight: 800,
                letterSpacing: 2.4 * u,
                color: soft,
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

/**
 * The brand lockup. Big enough to read in a feed and to become familiar over
 * repeated posts, small enough that the accomplishment stays the hero.
 */
function Lockup({ theme, u, invert }: { theme: Theme; u: number; invert?: boolean }) {
  const ink = invert ? "#FFF7E8" : theme.ink;
  const soft = invert ? "rgba(255,247,232,0.7)" : theme.inkSoft;

  if (theme.lockup === "tracked") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 * u }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14 * u,
            fontSize: 30 * u,
            fontWeight: 800,
            letterSpacing: 2 * u,
            color: soft,
          }}
        >
          TRACKED WITH
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 * u }}>
          <Pepper size={54 * u} rotate={-16} {...theme.pepper} />
          <div
            style={{
              display: "flex",
              fontSize: 60 * u,
              fontWeight: 900,
              color: ink,
              letterSpacing: -1.5 * u,
            }}
          >
            Cayenne Do It
          </div>
        </div>
        {theme.showDomain ? (
          <div
            style={{
              display: "flex",
              fontSize: 24 * u,
              fontWeight: 700,
              letterSpacing: 3 * u,
              color: soft,
            }}
          >
            CAYENNEDOIT.COM
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 * u }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 * u }}>
        <Pepper size={62 * u} rotate={-16} {...theme.pepper} />
        <div
          style={{
            display: "flex",
            fontSize: 66 * u,
            fontWeight: 900,
            color: ink,
            letterSpacing: -2 * u,
          }}
        >
          Cayenne Do It
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 27 * u,
          fontWeight: 800,
          letterSpacing: 6 * u,
          color: theme.accent,
        }}
      >
        SMALL HABIT. BIG FIRE.
      </div>
      {theme.showDomain ? (
        <div
          style={{
            display: "flex",
            fontSize: 23 * u,
            fontWeight: 700,
            letterSpacing: 3 * u,
            color: soft,
          }}
        >
          CAYENNEDOIT.COM
        </div>
      ) : null}
    </div>
  );
}

function Ring({ percent, u, track, accent, ink, soft }: {
  percent: number; u: number; track: string; accent: string; ink: string; soft: string;
}) {
  const size = 300 * u;
  const stroke = 26 * u;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", display: "flex", width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={accent} strokeWidth={stroke}
          strokeLinecap="round" fill="none" strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, percent / 100))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 86 * u, fontWeight: 900, color: ink }}>{percent}%</div>
        <div style={{ display: "flex", fontSize: 20 * u, fontWeight: 800, letterSpacing: 3 * u, color: soft }}>
          COMPLETE
        </div>
      </div>
    </div>
  );
}

/** Absolutely-positioned decoration; `inset` is unsupported, so sides are explicit. */
function Layer({ children, ...pos }: { children: React.ReactNode } & React.CSSProperties) {
  return <div style={{ position: "absolute", display: "flex", ...pos }}>{children}</div>;
}

// ---------------------------------------------------------------- layouts --

/** SIGNATURE — cream, a big illustrated pepper crossing the number, clean. */
function Signature(ctx: Ctx) {
  const { spec, theme, width, height, u } = ctx;
  return (
    <Surface {...ctx} padX={90 * u} padY={66 * u}>
      <Layer top={0} left={0} width={width} height={height}>
        <Halftone width={width} height={height} color={theme.accent} gap={30 * u} radius={3 * u} opacity={0.08} />
      </Layer>
      {/* pepper anchored to the hero, breaking the grid a little */}
      <Layer top={height * 0.16} left={-46 * u}>
        <Pepper size={340 * u} rotate={28} {...theme.pepper} opacity={0.5} />
      </Layer>
      <Layer top={height * 0.6} left={width - 130 * u}>
        <Pepper size={300 * u} rotate={-152} {...theme.pepper} opacity={0.42} />
      </Layer>

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 * u }}>
        <Pepper size={44 * u} rotate={-14} {...theme.pepper} />
        <div style={{ display: "flex", fontSize: 26 * u, fontWeight: 900, letterSpacing: 7 * u, color: theme.inkSoft }}>
          CAYENNE DO IT
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 0, paddingTop: 40 * u, paddingBottom: 40 * u }}>
        {spec.eyebrow ? (
          <div style={{ display: "flex", fontSize: 34 * u, fontWeight: 900, letterSpacing: 3 * u, color: theme.accent, marginBottom: 22 * u }}>
            {spec.eyebrow}
          </div>
        ) : null}
        {spec.ring ? <Ring percent={spec.ring.percent} u={u} track={theme.rule} accent={theme.accent} ink={theme.ink} soft={theme.inkSoft} /> : null}
        {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
        {spec.heroTitle ? (
          <div style={{ display: "flex", fontSize: 76 * u, fontWeight: 900, color: theme.hero, textAlign: "center", maxWidth: width - 220 * u, lineHeight: 1.06 }}>
            {spec.heroTitle}
          </div>
        ) : null}
        {spec.heroUnit ? (
          <div style={{ display: "flex", marginTop: 14 * u }}>
            <Unit text={spec.heroUnit} u={u} color={theme.accent} />
          </div>
        ) : null}

        <div style={{ display: "flex", width: 120 * u, height: 5 * u, background: theme.accent, borderRadius: 5 * u, margin: `${34 * u}px 0` }} />

        <Voice text={spec.voice} u={u} color={theme.ink} width={width - 200 * u} />
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 34 * u }}>
        {spec.stats.length ? (
          <StatRun stats={spec.stats} u={u} ink={theme.ink} soft={theme.inkSoft} accent={theme.accent} rule={theme.rule} />
        ) : null}
        <Lockup theme={theme} u={u} />
      </div>
    </Surface>
  );
}

/** ON FIRE — a glow band behind the number, embers, and a low flame edge. */
function OnFire(ctx: Ctx) {
  const { spec, theme, width, height, u } = ctx;
  return (
    <Surface {...ctx} padX={80 * u} padY={62 * u}>
      {/* A warm band behind the hero does the work that a blur would, if the
          renderer had one. Flames stay low so they read as an edge, not a fence. */}
      <Layer top={height * 0.24} left={0} width={width} height={height * 0.34}>
        <div
          style={{
            display: "flex",
            width,
            height: height * 0.34,
            background:
              "linear-gradient(180deg, rgba(217,45,32,0) 0%, rgba(241,90,36,0.34) 45%, rgba(217,45,32,0) 100%)",
          }}
        />
      </Layer>
      <Layer bottom={0} left={0} width={width} height={height * 0.3}>
        <PowderField width={width} height={height * 0.3} color="#F15A24" count={150} opacity={0.5} seed={31} />
      </Layer>
      <Layer bottom={0} left={0} width={width} height={height * 0.055}>
        <Flames
          width={width}
          height={height * 0.055}
          colors={["#4A1208", "#7A1F10", "#B52117", "#D9450F"]}
        />
      </Layer>
      <Layer top={-30 * u} left={width - 120 * u}>
        <Pepper size={280 * u} rotate={-158} {...theme.pepper} opacity={0.8} />
      </Layer>
      <Layer bottom={height * 0.1} left={-70 * u}>
        <Pepper size={250 * u} rotate={36} {...theme.pepper} opacity={0.45} />
      </Layer>

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 * u }}>
        <Pepper size={40 * u} rotate={-14} {...theme.pepper} />
        <div style={{ display: "flex", fontSize: 26 * u, fontWeight: 900, letterSpacing: 7 * u, color: theme.inkSoft }}>
          CAYENNE DO IT
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", paddingTop: 30 * u, paddingBottom: 30 * u }}>
        {spec.eyebrow ? (
          <div style={{ display: "flex", fontSize: 34 * u, fontWeight: 900, letterSpacing: 4 * u, color: theme.accentSoft, marginBottom: 18 * u }}>
            {spec.eyebrow}
          </div>
        ) : null}
        {spec.ring ? <Ring percent={spec.ring.percent} u={u} track={theme.rule} accent={theme.accent} ink={theme.ink} soft={theme.inkSoft} /> : null}
        {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
        {spec.heroTitle ? (
          <div style={{ display: "flex", fontSize: 76 * u, fontWeight: 900, color: theme.hero, textAlign: "center", maxWidth: width - 200 * u, lineHeight: 1.06 }}>
            {spec.heroTitle}
          </div>
        ) : null}
        {spec.heroUnit ? (
          <div style={{ display: "flex", marginTop: 16 * u }}>
            <Unit text={spec.heroUnit} u={u} color={theme.accent} />
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: 34 * u }}>
          <Voice text={spec.voice} u={u} color={theme.ink} width={width - 220 * u} />
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 30 * u }}>
        {spec.stats.length ? (
          <StatRun stats={spec.stats} u={u} ink={theme.ink} soft={theme.inkSoft} accent={theme.accent} rule={theme.rule} />
        ) : null}
        <Lockup theme={theme} u={u} />
      </div>
    </Surface>
  );
}

/** FRESH CAYENNE — whole peppers and a drift of ground powder. Editorial. */
function Fresh(ctx: Ctx) {
  const { spec, theme, width, height, u } = ctx;
  return (
    <Surface {...ctx} padX={88 * u} padY={64 * u}>
      <Layer bottom={0} left={0} width={width} height={height * 0.58}>
        <PowderField width={width} height={height * 0.58} color={theme.accent} count={210} opacity={0.5} />
      </Layer>
      <Layer top={-40 * u} left={-60 * u}>
        <Pepper size={280 * u} rotate={38} {...theme.pepper} opacity={0.9} />
      </Layer>
      <Layer top={40 * u} left={width - 170 * u}>
        <Pepper size={230 * u} rotate={-32} {...theme.pepper} opacity={0.85} />
      </Layer>
      <Layer bottom={-50 * u} left={width * 0.5 - 90 * u}>
        <Pepper size={220 * u} rotate={14} {...theme.pepper} opacity={0.22} />
      </Layer>

      <div style={{ position: "relative", display: "flex", fontSize: 26 * u, fontWeight: 900, letterSpacing: 7 * u, color: theme.inkSoft }}>
        CAYENNE DO IT
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", paddingTop: 34 * u, paddingBottom: 34 * u }}>
        {spec.eyebrow ? (
          <div style={{ display: "flex", fontSize: 32 * u, fontWeight: 900, letterSpacing: 4 * u, color: theme.accent, marginBottom: 20 * u }}>
            {spec.eyebrow}
          </div>
        ) : null}
        {spec.ring ? <Ring percent={spec.ring.percent} u={u} track={theme.rule} accent={theme.accent} ink={theme.ink} soft={theme.inkSoft} /> : null}
        {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
        {spec.heroTitle ? (
          <div style={{ display: "flex", fontSize: 72 * u, fontWeight: 900, color: theme.hero, textAlign: "center", maxWidth: width - 260 * u, lineHeight: 1.06 }}>
            {spec.heroTitle}
          </div>
        ) : null}
        {spec.heroUnit ? (
          <div style={{ display: "flex", marginTop: 14 * u }}>
            <Unit text={spec.heroUnit} u={u} color={theme.accent} />
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: 30 * u }}>
          <Voice text={spec.voice} u={u} color={theme.ink} width={width - 300 * u} />
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 * u }}>
        {spec.stats.length ? (
          <StatRun stats={spec.stats} u={u} ink={theme.ink} soft={theme.inkSoft} accent={theme.accent} rule={theme.rule} />
        ) : null}
        <Lockup theme={theme} u={u} />
      </div>
    </Surface>
  );
}

/** MASCOT — the character beside the number, voice line in a speech bubble. */
function MascotLayout(ctx: Ctx) {
  const { spec, theme, width, height, u } = ctx;
  return (
    <Surface {...ctx} padX={72 * u} padY={60 * u}>
      <Layer top={0} left={0} width={width} height={height}>
        <Halftone width={width} height={height} color="#D92D20" gap={34 * u} radius={4 * u} opacity={0.07} />
      </Layer>

      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 * u }}>
        <Pepper size={40 * u} rotate={-14} {...theme.pepper} />
        <div style={{ display: "flex", fontSize: 26 * u, fontWeight: 900, letterSpacing: 7 * u, color: theme.inkSoft }}>
          CAYENNE DO IT
        </div>
      </div>

      {/* number and character share the stage, side by side */}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", width: "100%", flex: 1, justifyContent: "center", paddingTop: 30 * u, paddingBottom: 30 * u }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 * u }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {spec.eyebrow ? (
              <div style={{ display: "flex", fontSize: 30 * u, fontWeight: 900, letterSpacing: 4 * u, color: theme.accent, marginBottom: 8 * u }}>
                {spec.eyebrow}
              </div>
            ) : null}
            {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} max={360} /> : null}
            {spec.heroTitle ? (
              <div style={{ display: "flex", fontSize: 60 * u, fontWeight: 900, color: theme.hero, textAlign: "center", maxWidth: 520 * u, lineHeight: 1.06 }}>
                {spec.heroTitle}
              </div>
            ) : null}
            {spec.heroUnit ? (
              <div style={{ display: "flex", marginTop: 10 * u }}>
                <Unit text={spec.heroUnit} u={u} color={theme.accent} size={38} />
              </div>
            ) : null}
          </div>
          <MascotArt size={330 * u} />
        </div>

        {/* speech bubble */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 30 * u,
            padding: `${28 * u}px ${44 * u}px`,
            borderRadius: 40 * u,
            background: "#FFFDF8",
            border: `${4 * u}px solid ${theme.accent}`,
            maxWidth: width - 180 * u,
          }}
        >
          <Voice text={spec.voice} u={u} color={theme.ink} width={width - 280 * u} size={38} />
        </div>

      </div>

      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 * u }}>
        {spec.stats.length ? (
          <StatRun stats={spec.stats} u={u} ink={theme.ink} soft={theme.inkSoft} accent={theme.accent} rule={theme.rule} />
        ) : null}
        <Lockup theme={theme} u={u} />
      </div>
    </Surface>
  );
}

/** MINIMAL — left-aligned, enormous type, one hairline, nothing else. */
function Minimal(ctx: Ctx) {
  const { spec, theme, width, u } = ctx;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${86 * u}px ${86 * u}px`,
        background: theme.background,
        fontFamily: "Nunito",
        position: "relative",
      }}
    >
      <Layer top={70 * u} left={width - 130 * u}>
        <Pepper size={190 * u} rotate={-18} {...theme.pepper} opacity={0.9} />
      </Layer>

      <div style={{ display: "flex", fontSize: 26 * u, fontWeight: 900, letterSpacing: 7 * u, color: theme.inkSoft }}>
        CAYENNE DO IT
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {spec.eyebrow ? (
          <div style={{ display: "flex", fontSize: 30 * u, fontWeight: 900, letterSpacing: 4 * u, color: theme.accent, marginBottom: 16 * u }}>
            {spec.eyebrow}
          </div>
        ) : null}
        {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
        {spec.heroTitle ? (
          <div style={{ display: "flex", fontSize: 80 * u, fontWeight: 900, color: theme.hero, maxWidth: width - 200 * u, lineHeight: 1.04 }}>
            {spec.heroTitle}
          </div>
        ) : null}
        {spec.heroUnit ? (
          <div style={{ display: "flex", marginTop: 12 * u, fontSize: 44 * u, fontWeight: 900, letterSpacing: 5 * u, color: theme.accent }}>
            {spec.heroUnit}
          </div>
        ) : null}
        <div style={{ display: "flex", width: width - 172 * u, height: 3 * u, background: theme.rule, margin: `${44 * u}px 0` }} />
        <div
          style={{
            display: "flex",
            fontSize: 42 * u,
            fontWeight: 800,
            lineHeight: 1.25,
            color: theme.ink,
            maxWidth: width - 220 * u,
          }}
        >
          {spec.voice}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 * u }}>
          <div style={{ display: "flex", fontSize: 24 * u, fontWeight: 800, letterSpacing: 3 * u, color: theme.inkSoft }}>
            TRACKED WITH
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 * u }}>
            <Pepper size={46 * u} rotate={-16} {...theme.pepper} />
            <div style={{ display: "flex", fontSize: 54 * u, fontWeight: 900, color: theme.ink, letterSpacing: -1.5 * u }}>
              Cayenne Do It
            </div>
          </div>
        </div>
        {spec.stats.length ? (
          <StatRun stats={spec.stats.slice(0, 2)} u={u} ink={theme.ink} soft={theme.inkSoft} accent={theme.accent} rule={theme.rule} />
        ) : null}
      </div>
    </div>
  );
}

/** FACEBOOK — the voice line leads in a red band, then the number. Built to stop a thumb. */
function Facebook(ctx: Ctx) {
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
      {/* the hook, in a solid band across the top */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: `${44 * u}px ${72 * u}px ${48 * u}px`,
          background: "linear-gradient(120deg,#D92D20 0%,#F15A24 100%)",
          position: "relative",
        }}
      >
        <Layer top={-34 * u} left={width - 120 * u}>
          <Pepper size={190 * u} rotate={-150} body="#A3170F" shade="#7A1F10" stem="#2F6B53" opacity={0.45} />
        </Layer>
        <div
          style={{
            display: "flex",
            fontSize: (spec.voice.length > 58 ? 44 : 52) * u,
            fontWeight: 900,
            lineHeight: 1.16,
            color: "#FFF7E8",
            textAlign: "center",
            maxWidth: width - 190 * u,
            position: "relative",
          }}
        >
          {spec.voice}
        </div>
      </div>

      {/* the number */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          width: "100%",
          position: "relative",
          padding: `${20 * u}px ${72 * u}px`,
        }}
      >
        <Layer bottom={0} left={0} width={width} height={height * 0.22}>
          <PowderField width={width} height={height * 0.24} color="#F15A24" count={180} opacity={0.6} seed={19} />
        </Layer>
        <Layer top={height * 0.03} left={-40 * u}>
          <Pepper size={280 * u} rotate={32} {...theme.pepper} opacity={0.8} />
        </Layer>
        <Layer bottom={height * 0.02} left={width - 120 * u}>
          <Pepper size={250 * u} rotate={-158} {...theme.pepper} opacity={0.7} />
        </Layer>

        {spec.eyebrow ? (
          <div style={{ display: "flex", fontSize: 32 * u, fontWeight: 900, letterSpacing: 4 * u, color: theme.accent, marginBottom: 10 * u, position: "relative" }}>
            {spec.eyebrow}
          </div>
        ) : null}
        {spec.ring ? <Ring percent={spec.ring.percent} u={u} track={theme.rule} accent={theme.accent} ink={theme.ink} soft={theme.inkSoft} /> : null}
        {spec.heroValue ? <Hero value={spec.heroValue} u={u} color={theme.hero} /> : null}
        {spec.heroTitle ? (
          <div style={{ display: "flex", fontSize: 72 * u, fontWeight: 900, color: theme.hero, textAlign: "center", maxWidth: width - 200 * u, lineHeight: 1.06, position: "relative" }}>
            {spec.heroTitle}
          </div>
        ) : null}
        {spec.heroUnit ? (
          <div style={{ display: "flex", marginTop: 14 * u, position: "relative" }}>
            <Unit text={spec.heroUnit} u={u} color={theme.accent} size={50} />
          </div>
        ) : null}
        {spec.stats.length ? (
          <div style={{ display: "flex", marginTop: 40 * u, position: "relative" }}>
            <StatRun stats={spec.stats} u={u} ink={theme.ink} soft={theme.inkSoft} accent={theme.accent} rule={theme.rule} />
          </div>
        ) : null}
      </div>

      {/* the lockup, on its own footer bar so it reads at feed size */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6 * u,
          width: "100%",
          padding: `${34 * u}px 0 ${38 * u}px`,
          background: "rgba(255,247,232,0.06)",
          borderTop: `${3 * u}px solid rgba(255,247,232,0.16)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 * u }}>
          <div style={{ display: "flex", fontSize: 28 * u, fontWeight: 800, letterSpacing: 2 * u, color: theme.inkSoft }}>
            TRACKED WITH
          </div>
          <Pepper size={54 * u} rotate={-16} {...theme.pepper} />
          <div style={{ display: "flex", fontSize: 58 * u, fontWeight: 900, color: theme.ink, letterSpacing: -1.5 * u }}>
            Cayenne Do It
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 25 * u, fontWeight: 800, letterSpacing: 5 * u, color: theme.accent }}>
          SMALL HABIT. BIG FIRE.
        </div>
      </div>
    </div>
  );
}
