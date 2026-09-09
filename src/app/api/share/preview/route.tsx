import { buildSpec } from "@/lib/share/spec";
import {
  DEFAULT_TOGGLES,
  SHARE_KINDS,
  SIZES,
  THEME_IDS,
  type ShareKind,
  type ShareToggles,
  type SizeId,
  type ThemeId,
} from "@/lib/share/types";
import { DEFAULT_TONE, TONES, type Tone } from "@/lib/share/voice";
import { getSessionUser } from "@/server/auth";
import { buildCardStats } from "@/server/share/stats";
import { renderCardImage } from "@/server/share/image";
import { loadSharePhoto } from "@/server/share/photo";

export const runtime = "nodejs";

/**
 * Live preview for the Share Studio.
 *
 * The query string carries only *selections* — which card, which theme, which
 * toggles. Every number is derived server-side from the signed-in user's own
 * records, so a crafted URL cannot inflate a streak or borrow someone else's
 * data.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const params = new URL(request.url).searchParams;

  const kind = pick(params.get("kind"), SHARE_KINDS, "HOT_STREAK") as ShareKind;
  const theme = pick(params.get("theme"), THEME_IDS, "SIGNATURE") as ThemeId;
  const size = pick(
    params.get("size"),
    Object.keys(SIZES) as SizeId[],
    "FACEBOOK",
  ) as SizeId;

  const tone = pick(params.get("tone"), TONES, DEFAULT_TONE) as Tone;
  const custom = params.get("line");
  const lineIndex = Number.parseInt(params.get("li") ?? "0", 10);
  const line = custom
    ? { custom: sanitiseLine(custom) }
    : { index: Number.isFinite(lineIndex) ? lineIndex : 0 };
  const toggles = readToggles(params);
  const quoteOverride = params.has("quote") ? params.get("quote") || null : undefined;

  const photoId = params.get("photo");
  const [stats, photo] = await Promise.all([
    buildCardStats(user, {
      achievementId: params.get("achievement") ?? undefined,
      quoteOverride,
    }),
    // Ownership is checked here, not on the client: a preview URL must never be
    // a way to read somebody else's photo.
    photoId ? loadSharePhoto(photoId, user.id) : Promise.resolve(null),
  ]);

  return renderCardImage(buildSpec(kind, stats, toggles, tone, line), theme, size, {
    scale: clampScale(params.get("scale")),
    cache: "private",
    photo,
  });
}

function pick<T extends readonly string[]>(
  value: string | null,
  allowed: T,
  fallback: T[number],
): T[number] {
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T[number])
    : fallback;
}

function readToggles(params: URLSearchParams): ShareToggles {
  const raw = params.get("on");
  if (raw === null) return DEFAULT_TOGGLES;
  const on = new Set(raw.split(",").filter(Boolean));
  const out = { ...DEFAULT_TOGGLES };
  for (const key of Object.keys(out) as (keyof ShareToggles)[]) {
    out[key] = on.has(key);
  }
  return out;
}

/** User-written lines are their own words, but never newlines or an essay. */
function sanitiseLine(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 120);
}

function clampScale(raw: string | null): number {
  const value = Number.parseFloat(raw ?? "1");
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0.15, value));
}
