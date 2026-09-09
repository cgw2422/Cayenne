"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cx } from "@/components/ui/primitives";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/entitlements", label: "Entitlements" },
  { href: "/admin/sharing", label: "Sharing" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/audit", label: "Audit Log" },
  { href: "/admin/system", label: "System" },
];

/**
 * A sidebar on desktop, a scrolling tab strip on a phone. Same links, same
 * order, so the two layouts are the same mental model rather than two designs.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="shrink-0 lg:w-52"
    >
      <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors lg:w-full",
                  active
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800",
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
