import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Mascot } from "@/components/ui/Mascot";
import { BRAND } from "@/lib/brand";
import { prisma } from "@/lib/prisma";
import { specFromCard } from "@/server/share/card";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const card = await prisma.shareCard.findUnique({ where: { token } });
  if (!card) return { title: "Card not found" };

  const spec = specFromCard(card);
  const summary =
    spec.heroValue && spec.heroUnit
      ? `${spec.heroValue} ${spec.heroUnit.toLowerCase()}`
      : (spec.heroTitle ?? spec.eyebrow ?? BRAND.tagline);
  const image = `/api/share/${token}/image?size=FACEBOOK`;
  const title = `${summary} · ${BRAND.name}`;

  return {
    title,
    description: spec.subline ?? BRAND.tagline,
    openGraph: {
      title,
      description: spec.subline ?? BRAND.tagline,
      images: [{ url: image, width: 1200, height: 1500 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: spec.subline ?? BRAND.tagline,
      images: [image],
    },
  };
}

/**
 * The public landing page for a shared card. It shows only what the card itself
 * stores, and nothing that identifies the person who made it.
 */
export default async function SharedCardPage({ params }: Props) {
  const { token } = await params;
  const card = await prisma.shareCard.findUnique({ where: { token } });
  if (!card) notFound();

  const spec = specFromCard(card);
  const alt =
    spec.heroValue && spec.heroUnit
      ? `${spec.heroValue} ${spec.heroUnit.toLowerCase()}`
      : (spec.heroTitle ?? BRAND.tagline);
  const { width, height } = { width: 1080, height: 1350 };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-6 px-5 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/share/${token}/image?size=INSTAGRAM`}
        alt={`${alt}. ${spec.subline ?? ""}`}
        width={width}
        height={height}
        className="w-full rounded-[1.75rem] shadow-lift"
      />

      <div className="card flex items-center gap-4">
        <Mascot size={56} />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-charcoal-900">{BRAND.name}</p>
          <p className="text-sm text-charcoal-500">{BRAND.tagline}</p>
        </div>
        <Link
          href="/sign-up"
          className="fire-gradient shrink-0 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white shadow-lift"
        >
          Try it
        </Link>
      </div>

      <p className="text-center text-xs leading-relaxed text-charcoal-500">
        Cayenne Do It is a habit-tracking app. It doesn&apos;t provide medical advice.
      </p>
    </main>
  );
}
