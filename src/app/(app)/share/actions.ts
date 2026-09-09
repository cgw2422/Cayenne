"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { buildCardStats } from "@/server/share/stats";
import { imageUrl, publishCard, shareUrl } from "@/server/share/publish";
import { storeSharePhoto } from "@/server/share/photo";
import { captionsFor, type CaptionStyle } from "@/lib/share/captions";
import { DEFAULT_TONE, TONES, type Tone } from "@/lib/share/voice";
import { linesFor } from "@/lib/share/lines";
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
import type { ShareEventType } from "@prisma/client";

export type PublishInput = {
  kind: string;
  theme: string;
  size: string;
  toggles: Partial<ShareToggles>;
  /** The card's personality. Changes the headline, never the numbers. */
  tone?: string;
  /** Which line from the matched pool. */
  lineIndex?: number;
  /** The user's own words, if they wrote their own. */
  customLine?: string | null;
  /** undefined keeps today's quote, null removes it, a string overrides it. */
  quote?: string | null;
  achievementId?: string | null;
  /** Set only when the user attached their own photo. */
  photoId?: string | null;
};

export type PublishResult =
  | {
      ok: true;
      token: string;
      url: string;
      imageUrl: string;
      captions: Record<CaptionStyle, string>;
    }
  | { ok: false; message: string };

/**
 * Publishes a card. Selections come from the client; every number is re-derived
 * server-side from the user's own records, so nothing displayed can be forged.
 */
export async function publishShareCard(input: PublishInput): Promise<PublishResult> {
  const user = await requireUser();

  const kind = (SHARE_KINDS as readonly string[]).includes(input.kind)
    ? (input.kind as ShareKind)
    : "HOT_STREAK";
  const theme = (THEME_IDS as readonly string[]).includes(input.theme)
    ? (input.theme as ThemeId)
    : "SIGNATURE";
  const size = Object.keys(SIZES).includes(input.size)
    ? (input.size as SizeId)
    : "FACEBOOK";

  const toggles: ShareToggles = { ...DEFAULT_TOGGLES, ...input.toggles };
  const tone = (TONES as readonly string[]).includes(input.tone ?? "")
    ? (input.tone as Tone)
    : DEFAULT_TONE;

  const stats = await buildCardStats(user, {
    achievementId: input.achievementId ?? undefined,
    quoteOverride: input.quote,
  });

  const line = input.customLine
    ? { custom: input.customLine.replace(/\s+/g, " ").trim().slice(0, 120) }
    : { index: Number.isFinite(input.lineIndex) ? Number(input.lineIndex) : 0 };

  const card = await publishCard({
    userId: user.id,
    kind,
    theme,
    size,
    tone,
    line,
    stats,
    toggles,
    photoId: input.photoId ?? null,
  });

  await record(user.id, "IMAGE_GENERATED", { kind, theme, size });

  return {
    ok: true,
    token: card.token,
    url: shareUrl(card.token),
    imageUrl: imageUrl(card.token, size),
    captions: captionsFor(kind, stats),
  };
}

/**
 * Records what happened inside the app. Deliberately never captures where an
 * image ended up — the Web Share API doesn't report it and we don't ask.
 */
export async function trackShareEvent(input: {
  event: string;
  kind?: string | null;
  theme?: string | null;
  size?: string | null;
  captionStyle?: string | null;
}): Promise<{ ok: boolean }> {
  const user = await requireUser();

  const allowed: ShareEventType[] = [
    "STUDIO_OPENED",
    "TYPE_SELECTED",
    "TEMPLATE_SELECTED",
    "IMAGE_GENERATED",
    "IMAGE_SAVED",
    "NATIVE_SHARE_CLICKED",
    "FACEBOOK_SHARE_CLICKED",
    "CAPTION_COPIED",
    "WORDING_CHANGED",
  ];
  if (!allowed.includes(input.event as ShareEventType)) return { ok: false };

  await record(user.id, input.event as ShareEventType, {
    kind: input.kind,
    theme: input.theme,
    size: input.size,
    captionStyle: input.captionStyle,
  });
  return { ok: true };
}

async function record(
  userId: string,
  event: ShareEventType,
  detail: {
    kind?: string | null;
    theme?: string | null;
    size?: string | null;
    captionStyle?: string | null;
  },
) {
  // Analytics must never break a share, so failures are swallowed.
  await prisma.shareEvent
    .create({
      data: {
        userId,
        event,
        kind: (SHARE_KINDS as readonly string[]).includes(detail.kind ?? "")
          ? (detail.kind as ShareKind)
          : null,
        theme: (THEME_IDS as readonly string[]).includes(detail.theme ?? "")
          ? (detail.theme as ThemeId)
          : null,
        size: Object.keys(SIZES).includes(detail.size ?? "")
          ? (detail.size as SizeId)
          : null,
        captionStyle: detail.captionStyle?.slice(0, 20) ?? null,
      },
    })
    .catch(() => undefined);
}

/** The lines this user can cycle through, plus anything they've written before. */
export async function lineOptions(input: {
  kind: string;
  tone: string;
  achievementId?: string | null;
}): Promise<{ suggested: string[]; saved: string[] }> {
  const user = await requireUser();

  const kind = (SHARE_KINDS as readonly string[]).includes(input.kind)
    ? (input.kind as ShareKind)
    : "HOT_STREAK";
  const tone = (TONES as readonly string[]).includes(input.tone)
    ? (input.tone as Tone)
    : DEFAULT_TONE;

  const [stats, saved] = await Promise.all([
    buildCardStats(user, { achievementId: input.achievementId ?? undefined }),
    prisma.savedLine.findMany({
      where: { userId: user.id },
      orderBy: { usedAt: "desc" },
      take: 12,
      select: { text: true },
    }),
  ]);

  return { suggested: linesFor(kind, tone, stats), saved: saved.map((l) => l.text) };
}

/** Keeps a line the user wrote, so a favourite can be reused. */
export async function saveLine(text: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 120);
  if (clean.length < 2) return { ok: false };

  await prisma.savedLine.upsert({
    where: { userId_text: { userId: user.id, text: clean } },
    create: { userId: user.id, text: clean },
    update: { usedAt: new Date() },
  });
  return { ok: true };
}

export async function forgetLine(text: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  await prisma.savedLine.deleteMany({ where: { userId: user.id, text } });
  return { ok: true };
}

/**
 * Stores a photo for the Journey photo template.
 *
 * The client downscales and re-encodes before this is called, so what arrives
 * is already small. Nothing here reads the user's health data, and the photo
 * only reaches a card if they then publish one with it attached.
 */
export async function uploadSharePhoto(input: {
  dataUrl: string;
  width: number;
  height: number;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const user = await requireUser();
  return storeSharePhoto(user.id, input);
}

/** Quotes the user can pick from, for the "choose another quote" option. */
export async function quoteChoices() {
  const quotes = await prisma.quote.findMany({
    where: { category: { in: ["DAILY", "STREAK", "ENCOURAGEMENT", "MILESTONE", "FUNNY"] } },
    select: { id: true, text: true },
    orderBy: { text: "asc" },
    take: 60,
  });
  return quotes;
}
