import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { renderCard } from "@/server/share/render";
import { SIZES, type CardSpec, type SizeId, type ThemeId } from "@/lib/share/types";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

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
 * The single path from spec to PNG. Both the studio preview and the published
 * card go through here, which is what guarantees the export matches the preview
 * exactly — there is only one renderer.
 *
 * `scale` shrinks the output for thumbnails without changing the layout, since
 * every dimension in the card is derived from its width.
 */
export async function renderCardImage(
  spec: CardSpec,
  theme: ThemeId,
  size: SizeId,
  options: { scale?: number; cache?: "public" | "private" } = {},
) {
  const scale = options.scale ?? 1;
  const width = Math.round(SIZES[size].width * scale);
  const height = Math.round(SIZES[size].height * scale);

  return new ImageResponse(renderCard(spec, theme, { width, height }), {
    width,
    height,
    fonts: (await fonts()).map((f) => ({
      name: f.name,
      data: f.data as unknown as ArrayBuffer,
      weight: f.weight,
      style: "normal" as const,
    })),
    headers: {
      "Cache-Control":
        options.cache === "public"
          ? "public, max-age=31536000, immutable"
          : "private, max-age=60",
    },
  });
}
