import { Mascot } from "@/components/ui/Mascot";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 px-8 text-center">
      <Mascot pose="rest" size={110} />
      <h1 className="text-2xl font-extrabold text-charcoal-900">You&apos;re offline</h1>
      <p className="text-[15px] leading-relaxed text-charcoal-500">
        No connection right now. Your streak is safe — come back when you&apos;ve got
        signal and log today.
      </p>
    </main>
  );
}
