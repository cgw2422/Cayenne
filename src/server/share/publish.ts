import "server-only";

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { cardColumnsFrom } from "@/server/share/card";
import type { Tone } from "@/lib/share/voice";
import type { CardStats, ShareKind, ShareToggles, SizeId, ThemeId } from "@/lib/share/types";

/** Persists a card so it has a stable public link and a fixed snapshot. */
export async function publishCard(input: {
  userId: string;
  kind: ShareKind;
  theme: ThemeId;
  size: SizeId;
  tone: Tone;
  stats: CardStats;
  toggles: ShareToggles;
}) {
  return prisma.shareCard.create({
    data: {
      userId: input.userId,
      token: randomBytes(9).toString("base64url"),
      kind: input.kind,
      theme: input.theme,
      size: input.size,
      tone: input.tone,
      ...cardColumnsFrom(input.stats, input.toggles),
    },
  });
}

export function shareUrl(token: string) {
  return `${siteUrl()}/s/${token}`;
}

export function imageUrl(token: string, size?: SizeId) {
  return `${siteUrl()}/api/share/${token}/image${size ? `?size=${size}` : ""}`;
}
