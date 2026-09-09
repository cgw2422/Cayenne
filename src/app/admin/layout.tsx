import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdminPage } from "@/server/admin/guard";

export const metadata = { title: "Cayenne Do It Admin" };
export const dynamic = "force-dynamic";

/**
 * The admin shell.
 *
 * The guard here is the outer of two: every page underneath calls
 * `requireAdminPage()` for itself as well, because in the App Router a page's
 * data fetching runs alongside its layout rather than after it, so a layout
 * check alone would let a page's queries run before the 404 was decided.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminPage();
  // /admin sits outside the consumer app's layout, so the forced-reset gate has
  // to be repeated here rather than inherited. An admin with a pending reset
  // deals with it like anyone else.
  if (admin.passwordResetAt) redirect("/change-password");

  const env = environmentLabel();

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-[100rem] items-center gap-3 px-4 py-2.5">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded bg-red-600 text-[13px] text-white"
            >
              🌶
            </span>
            <span className="text-sm">Cayenne Do It Admin</span>
          </Link>

          <span
            className={
              env.production
                ? "rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-800 dark:bg-red-950 dark:text-red-300"
                : "rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }
          >
            {env.label}
          </span>

          <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
            <span className="hidden sm:inline">
              {admin.displayName} · {admin.email}
            </span>
            <Link href="/home" className="hover:underline">
              Exit to app
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[100rem] flex-col gap-4 px-4 py-4 lg:flex-row">
        <AdminNav />
        <main className="min-w-0 flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
}

/**
 * Names the environment without reading any secret.
 *
 * `NODE_ENV` and Railway's own environment name are the only inputs, and only
 * the name is ever rendered — never a URL, a credential, or the value of
 * anything else in the environment.
 */
function environmentLabel(): { label: string; production: boolean } {
  const named = process.env.RAILWAY_ENVIRONMENT_NAME?.trim();
  if (named) {
    return { label: named, production: /^prod/i.test(named) };
  }
  const production = process.env.NODE_ENV === "production";
  return { label: production ? "Production" : "Development", production };
}
