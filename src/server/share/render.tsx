import React from "react";

import { Icon, type IconName } from "@/lib/share/icons";
import { THEMES } from "@/lib/share/themes";
import type { CardSpec, ThemeId } from "@/lib/share/types";

/**
 * Renders a card spec into JSX for the image renderer.
 *
 * One layout serves every card type and theme: brand mark, eyebrow, hero,
 * subline, stat chips, quote, footer. Themes restyle the slots; specs decide
 * which slots are filled. That's what makes a new design a data change.
 *
 * Constraints of the renderer worth remembering: flex only, every element with
 * more than one child needs an explicit display, and radial gradients are
 * unreliable — depth comes from stacked linear washes.
 */
export function renderCard(
  spec: CardSpec,
  themeId: ThemeId,
  output: { width: number; height: number },
) {
  const theme = THEMES[themeId];
  const { width, height } = output;

  // Everything scales off the *actual* output width, so a half-size preview is a
  // faithful miniature of the export rather than a full-size layout crammed into
  // a smaller canvas.
  const u = width / 1200;
  const tall = height / width > 1.4;
  const pad = 96 * u;

  const heroSize = heroFontSize(spec, u);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${pad * 0.78}px ${pad}px`,
        background: theme.background,
        fontFamily: "Nunito",
        position: "relative",
      }}
    >
      {theme.wash ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: height * 0.58,
            display: "flex",
            background: theme.wash,
          }}
        />
      ) : null}

      <Decoration theme={theme.decoration} accent={theme.decorationColor} u={u} width={width} />

      {/* ------------------------------------------------------ brand mark -- */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          fontSize: 22 * u,
          fontWeight: 800,
          letterSpacing: 6 * u,
          color: theme.inkSoft,
        }}
      >
        <Icon name="pepper" size={26 * u} color={theme.inkSoft} accent={theme.accent} />
        CAYENNE DO IT
      </div>

      {/* ------------------------------------------------------------ body -- */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          flex: 1,
          justifyContent: "center",
          gap: 0,
        }}
      >
        {spec.eyebrow ? (
          <div
            style={{
              display: "flex",
              fontSize: (spec.eyebrow.length > 26 ? 30 : 36) * u,
              fontWeight: 900,
              letterSpacing: 2 * u,
              color: theme.accent,
              marginBottom: 24 * u,
              maxWidth: width - pad * 2,
              lineHeight: 1.15,
            }}
          >
            {spec.eyebrow}
          </div>
        ) : null}

        {spec.ring ? (
          <ProgressRing
            percent={spec.ring.percent}
            u={u}
            track={theme.rule}
            accent={theme.accent}
            ink={theme.ink}
            inkSoft={theme.inkSoft}
          />
        ) : null}

        {spec.heroValue ? (
          <div
            style={{
              display: "flex",
              fontSize: heroSize,
              fontWeight: 900,
              lineHeight: 0.9,
              letterSpacing: -6 * u,
              color: theme.hero,
            }}
          >
            {spec.heroValue}
          </div>
        ) : null}

        {spec.heroUnit ? (
          <div
            style={{
              display: "flex",
              marginTop: 18 * u,
              fontSize: (spec.heroUnit.length > 16 ? 34 : 44) * u,
              fontWeight: 900,
              letterSpacing: 4 * u,
              color: theme.accent,
              maxWidth: width - pad * 2,
              lineHeight: 1.15,
            }}
          >
            {spec.heroUnit}
          </div>
        ) : null}

        {spec.heroTitle ? (
          <div
            style={{
              display: "flex",
              fontSize: (spec.heroTitle.length > 44 ? 54 : 72) * u,
              fontWeight: 900,
              lineHeight: 1.08,
              letterSpacing: -1 * u,
              color: theme.hero,
              maxWidth: width - pad * 2.2,
            }}
          >
            {spec.heroTitle}
          </div>
        ) : null}

        {spec.subline ? (
          <div
            style={{
              display: "flex",
              marginTop: 22 * u,
              fontSize: 32 * u,
              fontWeight: 700,
              color: theme.inkSoft,
              maxWidth: width - pad * 2.2,
              lineHeight: 1.3,
            }}
          >
            {spec.subline}
          </div>
        ) : null}

        {spec.stats.length ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16 * u,
              marginTop: 44 * u,
              alignItems: "center",
            }}
          >
            {chunkStats(spec.stats).map((row, i) => (
              <div key={i} style={{ display: "flex", gap: 16 * u }}>
                {row.map((stat) => (
                  <Chip key={stat.label} stat={stat} theme={theme} u={u} />
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {spec.quote ? (
          <div
            style={{
              display: "flex",
              marginTop: 44 * u,
              fontSize: 30 * u,
              fontWeight: 700,
              fontStyle: "italic",
              color: theme.quoteInk,
              maxWidth: width - pad * 2.4,
              lineHeight: 1.35,
            }}
          >
            &ldquo;{spec.quote}&rdquo;
          </div>
        ) : null}

        {spec.footnote ? (
          <div
            style={{
              display: "flex",
              marginTop: 40 * u,
              fontSize: 24 * u,
              fontWeight: 700,
              color: theme.inkSoft,
              maxWidth: width - pad * 2,
            }}
          >
            {spec.footnote}
          </div>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- footer -- */}
      <Footer theme={theme} u={u} tall={tall} />
    </div>
  );
}

/** The hero has to read in one second in a feed, so it gets whatever room it has. */
function heroFontSize(spec: CardSpec, u: number) {
  const value = spec.heroValue ?? "";
  if (!value) return 0;
  if (value.length <= 2) return 400 * u;
  if (value.length <= 3) return 310 * u;
  if (value.length <= 7) return 170 * u;
  if (value.length <= 10) return 128 * u;
  return 104 * u;
}

/** Balanced rows: four chips read as 2+2, never 3+1. */
function chunkStats<T>(stats: T[]): T[][] {
  if (stats.length <= 3) return [stats];
  if (stats.length === 4) return [stats.slice(0, 2), stats.slice(2)];
  if (stats.length === 5) return [stats.slice(0, 3), stats.slice(3)];
  return [stats.slice(0, 3), stats.slice(3, 6)];
}

function Chip({
  stat,
  theme,
  u,
}: {
  stat: { icon: IconName; label: string; value: string };
  theme: (typeof THEMES)[ThemeId];
  u: number;
}) {
  const bare = theme.chipBg === "transparent";
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: bare ? `${8 * u}px ${18 * u}px` : `${20 * u}px ${30 * u}px`,
        borderRadius: 28 * u,
        background: theme.chipBg,
        border: bare ? "none" : `${2 * u}px solid ${theme.chipBorder}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8 * u,
          fontSize: 46 * u,
          fontWeight: 900,
          color: theme.chipValue,
        }}
      >
        <Icon name={stat.icon} size={34 * u} color={theme.chipValue} accent={theme.accent} />
        {stat.value}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 4 * u,
          fontSize: 19 * u,
          fontWeight: 800,
          letterSpacing: 2 * u,
          color: theme.chipInk,
        }}
      >
        {stat.label.toUpperCase()}
      </div>
    </div>
  );
}

/** Challenge progress, drawn as an arc so it reads at a glance. */
function ProgressRing({
  percent,
  u,
  track,
  accent,
  ink,
  inkSoft,
}: {
  percent: number;
  u: number;
  track: string;
  accent: string;
  ink: string;
  inkSoft: string;
}) {
  const size = 300 * u;
  const stroke = 26 * u;
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
        marginBottom: 30 * u,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, percent / 100))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 84 * u, fontWeight: 900, color: ink }}>
          {percent}%
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20 * u,
            fontWeight: 800,
            letterSpacing: 3 * u,
            color: inkSoft,
          }}
        >
          COMPLETE
        </div>
      </div>
    </div>
  );
}

/**
 * Branding, kept to the weight a running app would use. Visible enough to raise
 * the question, quiet enough that the accomplishment stays the hero.
 */
function Footer({
  theme,
  u,
  tall,
}: {
  theme: (typeof THEMES)[ThemeId];
  u: number;
  tall: boolean;
}) {
  if (theme.footer === "tracked") {
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6 * u,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 21 * u,
            fontWeight: 700,
            letterSpacing: 3 * u,
            color: theme.inkSoft,
          }}
        >
          TRACKED WITH
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            fontSize: 40 * u,
            fontWeight: 900,
            color: theme.ink,
            letterSpacing: -0.5 * u,
          }}
        >
          Cayenne Do It
          <Icon name="pepper" size={34 * u} color={theme.ink} accent={theme.accent} />
        </div>
        {theme.showDomain ? (
          <div
            style={{
              display: "flex",
              fontSize: 20 * u,
              fontWeight: 700,
              letterSpacing: 2 * u,
              color: theme.inkSoft,
            }}
          >
            CayenneDoIt.com
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8 * u,
      }}
    >
      <div
        style={{
          display: "flex",
          width: 88 * u,
          height: 4 * u,
          borderRadius: 4 * u,
          background: theme.accent,
          marginBottom: (tall ? 18 : 10) * u,
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 46 * u,
          fontWeight: 900,
          color: theme.ink,
          letterSpacing: -1 * u,
        }}
      >
        Cayenne Do It
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 22 * u,
          fontWeight: 800,
          letterSpacing: 5 * u,
          color: theme.inkSoft,
        }}
      >
        SMALL HABIT. BIG FIRE.
      </div>
      {theme.showDomain ? (
        <div
          style={{
            display: "flex",
            marginTop: 4 * u,
            fontSize: 20 * u,
            fontWeight: 700,
            letterSpacing: 2 * u,
            color: theme.inkSoft,
          }}
        >
          CayenneDoIt.com
        </div>
      ) : null}
    </div>
  );
}

/** Static decoration — deterministic so a card always renders identically. */
function Decoration({
  theme,
  accent,
  u,
  width,
}: {
  theme: "none" | "confetti" | "grain";
  accent: string;
  u: number;
  width: number;
}) {
  if (theme === "none") return null;

  if (theme === "grain") {
    return (
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 160 * u,
          display: "flex",
          background: `linear-gradient(0deg, ${accent}22 0%, transparent 100%)`,
        }}
      />
    );
  }

  const dots = [
    { x: 0.1, y: 0.14, s: 16, o: 0.55 },
    { x: 0.86, y: 0.1, s: 12, o: 0.5 },
    { x: 0.2, y: 0.26, s: 10, o: 0.4 },
    { x: 0.78, y: 0.3, s: 18, o: 0.35 },
    { x: 0.06, y: 0.48, s: 12, o: 0.3 },
    { x: 0.93, y: 0.52, s: 14, o: 0.32 },
    { x: 0.26, y: 0.74, s: 10, o: 0.25 },
    { x: 0.72, y: 0.8, s: 13, o: 0.28 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${d.x * 100}%`,
            top: `${d.y * 100}%`,
            width: d.s * u * (width / 1200) * 1.6,
            height: d.s * u * (width / 1200) * 1.6,
            borderRadius: 3 * u,
            background: accent,
            opacity: d.o,
            display: "flex",
          }}
        />
      ))}
    </div>
  );
}
