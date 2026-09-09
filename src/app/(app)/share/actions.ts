"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { buildCardStats } from "@/server/share/stats";
import { imageUrl, publishCard, shareUrl } from "@/server/share/publish";
import { captionsFor, type CaptionStyle } from "@/lib/share/captions";
import { DEFAULT_TONE, TONES, type Tone } from "@/lib/share/voice";
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
  /** undefined keeps today's quote, null removes it, a string overrides it. */
  quote?: string | null;
  achievementId?: string | null;
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

  const card = await publishCard({ userId: user.id, kind, theme, size, tone, stats, toggles });

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
    "CAPTION_COPIED",
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
