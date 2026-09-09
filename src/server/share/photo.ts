import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Photos a user attached to a share card.
 *
 * A photo exists here for one reason only: the user picked it for a card they
 * were about to post. Nothing in the app produces one, no card renders one the
 * user didn't attach, and a photo is only ever readable through the card it
 * belongs to or by its owner.
 *
 * The bytes live in Postgres rather than object storage. They are small by
 * construction — the client downscales and re-encodes before upload — and one
 * fewer service to configure is worth more here than the savings.
 */

/** Formats a browser can produce and the image renderer can read. */
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Comfortably above a 1400px JPEG, well below anything worth storing in a row. */
const MAX_BYTES = 1_500_000;

/** How many photos one account keeps. Older unused ones are swept up. */
const KEEP = 10;

export type PhotoInput = { dataUrl: string; width: number; height: number };

export async function storeSharePhoto(userId: string, input: PhotoInput) {
  const parsed = parseDataUrl(input.dataUrl);
  if (!parsed) return { ok: false as const, message: "That image couldn't be read." };
  if (parsed.bytes.byteLength > MAX_BYTES) {
    return { ok: false as const, message: "That image is too large." };
  }

  const width = clampSide(input.width);
  const height = clampSide(input.height);
  if (!width || !height) {
    return { ok: false as const, message: "That image couldn't be read." };
  }

  const photo = await prisma.sharePhoto.create({
    data: { userId, mime: parsed.mime, width, height, bytes: parsed.bytes },
    select: { id: true },
  });

  await sweep(userId);
  return { ok: true as const, id: photo.id };
}

/** The photo as a data URI, ready for the image renderer. */
export async function loadSharePhoto(id: string, ownerId?: string) {
  const photo = await prisma.sharePhoto.findUnique({
    where: { id },
    select: { userId: true, mime: true, bytes: true },
  });
  if (!photo) return null;
  if (ownerId && photo.userId !== ownerId) return null;
  return `data:${photo.mime};base64,${Buffer.from(photo.bytes).toString("base64")}`;
}

/**
 * Keeps the most recent few, and anything a published card still points at.
 * Without this an account accumulates every photo ever previewed.
 */
async function sweep(userId: string) {
  const recent = await prisma.sharePhoto.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
    take: KEEP,
  });

  await prisma.sharePhoto.deleteMany({
    where: {
      userId,
      id: { notIn: recent.map((p) => p.id) },
      cards: { none: {} },
    },
  });
}

function parseDataUrl(raw: string) {
  const match = /^data:([a-z/+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(raw.trim());
  if (!match) return null;
  const [, mime, body] = match;
  if (!ALLOWED.has(mime)) return null;
  const bytes = Buffer.from(body, "base64");
  return bytes.byteLength ? { mime, bytes } : null;
}

function clampSide(value: number) {
  return Number.isFinite(value) && value > 0 && value <= 6000 ? Math.round(value) : 0;
}
