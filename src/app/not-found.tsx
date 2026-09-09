import Link from "next/link";

import { Mascot } from "@/components/ui/Mascot";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-8 text-center">
      <Mascot pose="rest" size={110} />
      <h1 className="text-2xl font-extrabold text-charcoal-900">Nothing here</h1>
      <p className="text-[15px] leading-relaxed text-charcoal-500">
        That page doesn&apos;t exist — or the link has cooled off.
      </p>
      <Link
        href="/home"
        className="fire-gradient mt-1 rounded-2xl px-6 py-3.5 font-extrabold text-white shadow-lift"
      >
        Back to home
      </Link>
    </main>
  );
}
