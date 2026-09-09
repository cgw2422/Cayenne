import Link from "next/link";

import { Mascot } from "@/components/ui/Mascot";
import { BRAND } from "@/lib/brand";

export function AppHeader({
  displayName,
  unseenCount = 0,
}: {
  displayName: string;
  unseenCount?: number;
}) {
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-5">
      <Link href="/home" className="flex items-center gap-2">
        <Mascot size={38} />
        <span className="text-lg font-extrabold leading-none tracking-tight text-charcoal-900">
          {BRAND.name}
        </span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/more/achievements"
          className="tap relative grid place-items-center rounded-full"
          aria-label={
            unseenCount > 0
              ? `Achievements, ${unseenCount} new`
              : "Achievements"
          }
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9Z"
              stroke="#3D3A36"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M10.3 21a2 2 0 0 0 3.4 0" stroke="#3D3A36" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          {unseenCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-cayenne-600 text-[9px] font-extrabold text-white">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          ) : null}
        </Link>

        <Link
          href="/more"
          aria-label="Profile and settings"
          className="tap grid size-10 place-items-center rounded-full fire-gradient text-sm font-extrabold text-white"
        >
          {initials || "🌶"}
        </Link>
      </div>
    </header>
  );
}
