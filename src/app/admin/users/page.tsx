import Link from "next/link";

import { Badge, Empty, Panel, TableWrap, Td, Th, shortDate, stamp } from "@/components/admin/shell";
import { cx } from "@/components/ui/primitives";
import { requireAdminPage } from "@/server/admin/guard";
import {
  ACTIVE_WINDOW_DAYS,
  PAGE_SIZE,
  SORTS,
  SORT_LABEL,
  listUsers,
  parseFilters,
  type UserFilters,
} from "@/server/admin/users";

export const metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdminPage();

  const filters = parseFilters(await searchParams);
  const { rows, total, pages } = await listUsers(filters);
  const activeCutoff = Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Users</h1>
        <p className="text-xs text-slate-500">
          {total.toLocaleString()} account{total === 1 ? "" : "s"}. Health
          measurements, journal entries and photos are never shown here.
        </p>
      </div>

      <Panel>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-[12rem] flex-1">
            <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Search
            </span>
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Name or email"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>

          <Select name="entitlement" label="Entitlement" value={filters.entitlement}
            options={[["all", "All"], ["FREE", "Free"], ["LIFETIME", "Lifetime"]]} />
          <Select name="activity" label="Activity" value={filters.activity}
            options={[["all", "All"], ["active", `Active (${ACTIVE_WINDOW_DAYS}d)`], ["inactive", "Inactive"]]} />
          <Select name="sort" label="Sort" value={filters.sort}
            options={SORTS.map((s) => [s, SORT_LABEL[s]] as [string, string])} />

          <button
            type="submit"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          >
            Apply
          </button>
          {filters.q || filters.entitlement !== "all" || filters.activity !== "all" ? (
            <Link href="/admin/users" className="text-xs text-slate-500 hover:underline">
              Clear
            </Link>
          ) : null}
        </form>
      </Panel>

      <Panel>
        {rows.length === 0 ? (
          <Empty>No accounts match those filters.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th href={sortHref(filters, "signup")} active={filters.sort === "signup"}>
                  User
                </Th>
                <Th href={sortHref(filters, "signup")} active={filters.sort === "signup"}>
                  Created
                </Th>
                <Th href={sortHref(filters, "active")} active={filters.sort === "active"}>
                  Last active
                </Th>
                <Th>Entitlement</Th>
                <Th numeric href={sortHref(filters, "logs")} active={filters.sort === "logs"}>
                  Days
                </Th>
                <Th numeric href={sortHref(filters, "streak")} active={filters.sort === "streak"}>
                  Streak
                </Th>
                <Th numeric>Best</Th>
                <Th numeric>Chal.</Th>
                <Th numeric>Shares</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => {
                const active =
                  user.lastSeenAt !== null && user.lastSeenAt.getTime() >= activeCutoff;
                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <Td>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium text-sky-700 hover:underline dark:text-sky-400"
                      >
                        {user.displayName}
                      </Link>
                      <span className="block truncate text-xs text-slate-500">
                        {user.email}
                      </span>
                      <span className="mt-0.5 flex gap-1">
                        {user.role === "PLATFORM_ADMIN" ? (
                          <Badge tone="info">Admin</Badge>
                        ) : null}
                        {user.disabledAt ? <Badge tone="bad">Disabled</Badge> : null}
                        {!active ? <Badge>Inactive</Badge> : null}
                      </span>
                    </Td>
                    <Td muted>{shortDate(user.createdAt)}</Td>
                    <Td muted>{user.lastSeenAt ? stamp(user.lastSeenAt) : "Never"}</Td>
                    <Td>
                      <EntitlementBadge
                        entitlement={user.entitlement}
                        source={user.entitlementSource}
                      />
                    </Td>
                    <Td numeric>{user.profile?.totalDays ?? 0}</Td>
                    <Td numeric>{user.profile?.currentStreak ?? 0}</Td>
                    <Td numeric>{user.profile?.longestStreak ?? 0}</Td>
                    <Td numeric>{user._count.challenges}</Td>
                    <Td numeric>{user._count.shareCards}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}

        {pages > 1 ? (
          <nav className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {filters.page} of {pages} · {PAGE_SIZE} per page
            </span>
            <span className="flex gap-2">
              {filters.page > 1 ? (
                <Link className="hover:underline" href={pageHref(filters, filters.page - 1)}>
                  ← Previous
                </Link>
              ) : null}
              {filters.page < pages ? (
                <Link className="hover:underline" href={pageHref(filters, filters.page + 1)}>
                  Next →
                </Link>
              ) : null}
            </span>
          </nav>
        ) : null}
      </Panel>
    </div>
  );
}

export function EntitlementBadge({
  entitlement,
  source,
}: {
  entitlement: string;
  source: string | null;
}) {
  if (entitlement !== "LIFETIME") return <Badge>Free</Badge>;
  if (source === "COMPLIMENTARY") return <Badge tone="warn">Complimentary</Badge>;
  if (source === "PAID") return <Badge tone="good">Paid lifetime</Badge>;
  return <Badge tone="good">Lifetime</Badge>;
}

function Select({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: [string, string][];
}) {
  return (
    <label>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        name={name}
        defaultValue={value}
        className={cx(
          "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none",
          "focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950",
        )}
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
}

function query(filters: UserFilters, overrides: Record<string, string>) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.entitlement !== "all") params.set("entitlement", filters.entitlement);
  if (filters.activity !== "all") params.set("activity", filters.activity);
  if (filters.sort !== "signup") params.set("sort", filters.sort);
  for (const [key, value] of Object.entries(overrides)) params.set(key, value);
  const text = params.toString();
  return text ? `/admin/users?${text}` : "/admin/users";
}

function sortHref(filters: UserFilters, sort: string) {
  return query(filters, { sort, page: "1" });
}

function pageHref(filters: UserFilters, page: number) {
  return query(filters, { page: String(page) });
}
