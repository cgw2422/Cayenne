"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cx } from "@/components/ui/primitives";

const NAV = [
  { href: "/home", label: "Home", icon: HomeIcon },
  { href: "/log", label: "Log", icon: LogIcon },
  { href: "/progress", label: "Progress", icon: ProgressIcon },
  { href: "/recipes", label: "Recipes", icon: RecipeIcon },
  { href: "/more", label: "More", icon: MoreIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-cream-50/95 backdrop-blur-lg"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "tap flex flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors",
                  active ? "text-cayenne-600" : "text-charcoal-500 hover:text-charcoal-700",
                )}
              >
                <Icon active={active} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav />
    </div>
  );
}

type IconProps = { active?: boolean };

function base(active?: boolean) {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: active ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: active ? 1.4 : 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function HomeIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.6V20h14V9.6" />
    </svg>
  );
}

function LogIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <rect x="4" y="4" width="16" height="17" rx="3.5" />
      <path d="M8.5 12.5 11 15l4.5-5" stroke={active ? "#fff" : "currentColor"} />
    </svg>
  );
}

function ProgressIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M4 20V11" />
      <path d="M10 20V5" />
      <path d="M16 20v-6" />
      <path d="M22 20H2" fill="none" stroke="currentColor" />
    </svg>
  );
}

function RecipeIcon({ active }: IconProps) {
  return (
    <svg {...base(active)}>
      <path d="M6 3h11a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 3v18" stroke={active ? "#fff" : "currentColor"} />
    </svg>
  );
}

function MoreIcon({ active }: IconProps) {
  return (
    <svg {...base(active)} fill="currentColor" stroke="none">
      <circle cx="5.5" cy="12" r="1.9" />
      <circle cx="12" cy="12" r="1.9" />
      <circle cx="18.5" cy="12" r="1.9" />
    </svg>
  );
}
