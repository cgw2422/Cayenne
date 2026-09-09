import "server-only";

import { prisma } from "@/lib/prisma";
import { KIND_META, THEME_LABEL, type ShareKind, type ThemeId } from "@/lib/share/types";
import { TONE_LABEL, type Tone } from "@/lib/share/voice";

/**
 * Share analytics.
 *
 * What is measured is what happened inside the app: a studio opened, an image
 * generated, a caption copied. Where an image ended up afterwards is not
 * measured — the Web Share API does not report a destination, and we do not go
 * looking for one by other means.
 */

export type FunnelStep = { event: string; label: string; count: number };

const FUNNEL: { event: string; label: string }[] = [
  { event: "STUDIO_OPENED", label: "Share Studio opened" },
  { event: "TYPE_SELECTED", label: "Card type chosen" },
  { event: "TEMPLATE_SELECTED", label: "Template chosen" },
  { event: "WORDING_CHANGED", label: "Wording changed" },
  { event: "IMAGE_GENERATED", label: "Images generated" },
  { event: "IMAGE_SAVED", label: "Images saved" },
  { event: "NATIVE_SHARE_CLICKED", label: "Native share tapped" },
  { event: "FACEBOOK_SHARE_CLICKED", label: "Share to Facebook tapped" },
  { event: "CAPTION_COPIED", label: "Captions copied" },
];

export type Breakdown = { key: string; label: string; count: number; pct: number };

export type SharingReport = {
  funnel: FunnelStep[];
  kinds: Breakdown[];
  themes: Breakdown[];
  tones: Breakdown[];
  milestones: Breakdown[];
  totalCards: number;
};

/** Streak lengths worth asking about: the ones the app itself celebrates. */
const MILESTONES = [7, 14, 21, 30, 60, 90] as const;

export async function sharingReport(): Promise<SharingReport> {
  const [events, kinds, themes, tones, totalCards, milestoneRows] = await Promise.all([
    prisma.shareEvent.groupBy({ by: ["event"], _count: { _all: true } }),
    prisma.shareCard.groupBy({ by: ["kind"], _count: { _all: true } }),
    prisma.shareCard.groupBy({ by: ["theme"], _count: { _all: true } }),
    prisma.shareCard.groupBy({ by: ["tone"], _count: { _all: true } }),
    prisma.shareCard.count(),
    milestoneCounts(),
  ]);

  const eventCount = new Map(events.map((e) => [e.event as string, e._count._all]));

  return {
    funnel: FUNNEL.map((step) => ({
      ...step,
      count: eventCount.get(step.event) ?? 0,
    })),
    kinds: rank(
      kinds.map((k) => ({
        key: k.kind,
        label: KIND_META[k.kind as ShareKind].label,
        count: k._count._all,
      })),
      totalCards,
    ),
    themes: rank(
      themes.map((t) => ({
        key: t.theme,
        label: THEME_LABEL[t.theme as ThemeId],
        count: t._count._all,
      })),
      totalCards,
    ),
    tones: rank(
      tones.map((t) => ({
        key: t.tone,
        label: TONE_LABEL[t.tone as Tone],
        count: t._count._all,
      })),
      totalCards,
    ),
    milestones: milestoneRows,
    totalCards,
  };
}

/**
 * Which streak lengths people actually share at.
 *
 * The published card stores the streak it was made with, so this is a direct
 * read of the snapshot rather than a reconstruction. A card counts towards a
 * milestone when it was made within three days of reaching it — sharing tends
 * to happen the evening of, or the morning after.
 */
async function milestoneCounts(): Promise<Breakdown[]> {
  const rows = await prisma.$queryRaw<{ milestone: number; count: bigint }[]>`
    SELECT m.milestone, COUNT(c.id) AS count
    FROM (VALUES (7), (14), (21), (30), (60), (90)) AS m(milestone)
    LEFT JOIN "ShareCard" c
      ON c."streak" >= m.milestone AND c."streak" < m.milestone + 3
    GROUP BY m.milestone
    ORDER BY m.milestone`;

  const total = rows.reduce((sum, r) => sum + Number(r.count), 0);
  return MILESTONES.map((milestone) => {
    const found = rows.find((r) => Number(r.milestone) === milestone);
    const count = found ? Number(found.count) : 0;
    return {
      key: String(milestone),
      label: `${milestone} days`,
      count,
      pct: total ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}

function rank(rows: { key: string; label: string; count: number }[], total: number) {
  return rows
    .map((row) => ({
      ...row,
      pct: total ? Math.round((row.count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
