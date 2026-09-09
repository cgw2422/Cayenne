import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

/** Loaded once per server process — the files are small and never change. */
let fontCache: { name: string; data: Buffer; weight: 700 | 800 | 900 }[] | null = null;

async function fonts() {
  if (fontCache) return fontCache;
  const [w700, w800, w900] = await Promise.all([
    readFile(path.join(FONT_DIR, "Nunito-700.ttf")),
    readFile(path.join(FONT_DIR, "Nunito-800.ttf")),
    readFile(path.join(FONT_DIR, "Nunito-900.ttf")),
  ]);
  fontCache = [
    { name: "Nunito", data: w700, weight: 700 },
    { name: "Nunito", data: w800, weight: 800 },
    { name: "Nunito", data: w900, weight: 900 },
  ];
  return fontCache;
}

/**
 * Renders the shareable card as a PNG.
 *
 * `?format=square` gives a 1080×1080 image for a feed post; the default 1200×630
 * is the Open Graph size used in link previews.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const card = await prisma.shareCard.findUnique({ where: { token } });

  if (!card) return new Response("Not found", { status: 404 });

  const square = new URL(request.url).searchParams.get("format") === "square";
  const width = square ? 1080 : 1200;
  const height = square ? 1080 : 630;
  const s = square ? 1 : 0.74;

  const headlineSize =
    (card.headline.length > 26 ? 62 : card.headline.length > 18 ? 78 : 96) * s;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(158deg,#C0291C 0%,#8E2317 22%,#3A3A25 45%,#16412F 68%,#0B211A 100%)",
          position: "relative",
          fontFamily: "Nunito",
        }}
      >
        {/* Warm wash behind the headline. Linear gradients render predictably in
            this renderer; radial ones do not, so the glow is a stacked band. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: height * 0.5,
            display: "flex",
            background:
              "linear-gradient(180deg, rgba(255,176,32,0.22) 0%, rgba(255,176,32,0) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: `0 ${width * 0.09}px`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              color: "rgba(255,247,232,0.72)",
              fontSize: 24 * s,
              fontWeight: 800,
              letterSpacing: 10 * s,
            }}
          >
            CAYENNE DO IT
          </div>

          <div style={{ display: "flex", marginTop: 30 * s }}>
            <Flame size={92 * s} />
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 18 * s,
              fontSize: headlineSize,
              fontWeight: 900,
              color: "#FFF7E8",
              lineHeight: 1.04,
              letterSpacing: -2 * s,
              textAlign: "center",
            }}
          >
            {card.headline}
          </div>

          {card.subline ? (
            <div
              style={{
                display: "flex",
                marginTop: 24 * s,
                fontSize: 40 * s,
                fontWeight: 800,
                color: "#FF8A4C",
              }}
            >
              {card.subline}
            </div>
          ) : null}

          {card.quoteText ? (
            <div
              style={{
                display: "flex",
                marginTop: 30 * s,
                fontSize: 32 * s,
                fontWeight: 700,
                color: "rgba(255,247,232,0.72)",
                maxWidth: width * 0.74,
                lineHeight: 1.35,
              }}
            >
              “{card.quoteText}”
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 18 * s, marginTop: 46 * s }}>
            <Stat label="Day streak" value={String(card.streak)} s={s} />
            <Stat label="Total days" value={String(card.totalDays)} s={s} />
            {card.goalLabel ? (
              <Stat label="Working on" value={card.goalLabel} s={s} />
            ) : null}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: height * 0.07,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 34 * s,
              fontWeight: 900,
              color: "#FFF7E8",
              letterSpacing: -0.5,
            }}
          >
            Cayenne Do It
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8 * s,
              fontSize: 20 * s,
              fontWeight: 800,
              color: "rgba(255,247,232,0.55)",
              letterSpacing: 5 * s,
            }}
          >
            SMALL HABIT. BIG FIRE.
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: (await fonts()).map((f) => ({
        name: f.name,
        data: f.data as unknown as ArrayBuffer,
        weight: f.weight,
        style: "normal" as const,
      })),
      headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    },
  );
}

/** Drawn as SVG rather than an emoji so the card never depends on an emoji CDN. */
function Flame({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12.6 1.4c.3 3 .1 4.6-1.6 6.6-1.5 1.8-2.1 2.6-2.4 3.7-.4-.7-.7-1.6-.7-2.6C5.6 11 4.5 13.3 4.5 15.6 4.5 19.7 7.9 23 12 23s7.5-3.3 7.5-7.4c0-5.6-4.2-8.2-6.9-14.2Z"
        fill="#FFB020"
      />
      <path
        d="M12 23c-2.2 0-4-1.8-4-4 0-2.2 1.6-3.2 2.7-5.3.9 1.2 1.4 1.8 2.4 2.7 1.6 1.4 2.9 2.2 2.9 4.1-.4 1.4-2 2.5-4 2.5Z"
        fill="#F15A24"
      />
    </svg>
  );
}

function Stat({ label, value, s }: { label: string; value: string; s: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: `${16 * s}px ${28 * s}px`,
        borderRadius: 26 * s,
        background: "rgba(255,247,232,0.09)",
        border: "1px solid rgba(255,247,232,0.16)",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 42 * s,
          fontWeight: 900,
          color: "#FFF7E8",
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 4 * s,
          fontSize: 17 * s,
          fontWeight: 800,
          letterSpacing: 2.5 * s,
          color: "rgba(255,247,232,0.58)",
        }}
      >
        {label.toUpperCase()}
      </div>
    </div>
  );
}
