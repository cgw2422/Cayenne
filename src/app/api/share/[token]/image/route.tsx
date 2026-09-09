import { prisma } from "@/lib/prisma";
import { specFromCard } from "@/server/share/card";
import { renderCardImage } from "@/server/share/image";
import { loadSharePhoto } from "@/server/share/photo";
import { SIZES, type SizeId } from "@/lib/share/types";

export const runtime = "nodejs";

/**
 * The public PNG for a published card. Renders from the stored snapshot through
 * the same code path as the studio preview, so a shared link always shows what
 * the user saw when they published it.
 *
 * `?size=` re-renders the same card at another export size; `?scale=` shrinks it
 * for previews and link cards.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const card = await prisma.shareCard.findUnique({ where: { token } });
  if (!card) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const requested = url.searchParams.get("size");
  const size: SizeId =
    requested && requested in SIZES ? (requested as SizeId) : card.size;
  const scale = clampScale(url.searchParams.get("scale"));

  const photo = card.photoId ? await loadSharePhoto(card.photoId) : null;

  return renderCardImage(specFromCard(card), card.theme, size, {
    scale,
    cache: "public",
    photo,
  });
}

function clampScale(raw: string | null): number {
  const value = Number.parseFloat(raw ?? "1");
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0.15, value));
}
