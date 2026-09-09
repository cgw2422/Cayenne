import Link from "next/link";

import { Badge, Empty, Panel, TableWrap, Td, Th, stamp } from "@/components/admin/shell";
import { prisma } from "@/lib/prisma";
import { ACTION_LABEL, DESTRUCTIVE } from "@/server/admin/audit";
import { requireAdminPage } from "@/server/admin/guard";
import type { AdminAction } from "@prisma/client";

export const metadata = { title: "Audit Log · Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

/**
 * The audit log. Append-only, and there is no delete path anywhere in the app.
 *
 * Emails were copied in when each row was written, so entries about accounts
 * that have since been deleted still say who they were about.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;

  const action = isAction(params.action) ? params.action : null;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [total, rows] = await Promise.all([
    prisma.adminAuditLog.count({ where: action ? { action } : {} }),
    prisma.adminAuditLog.findMany({
      where: action ? { action } : {},
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Audit log</h1>
        <p className="text-xs text-slate-500">
          {total.toLocaleString()} entr{total === 1 ? "y" : "ies"}. Written in the
          same code path as the change, and never edited or removed.
        </p>
      </div>

      <Panel>
        <nav aria-label="Filter by action" className="flex flex-wrap gap-1.5 text-xs">
          <Chip href="/admin/audit" active={!action}>
            All
          </Chip>
          {(Object.keys(ACTION_LABEL) as AdminAction[]).map((key) => (
            <Chip
              key={key}
              href={`/admin/audit?action=${key}`}
              active={action === key}
            >
              {ACTION_LABEL[key]}
            </Chip>
          ))}
        </nav>
      </Panel>

      <Panel>
        {rows.length === 0 ? (
          <Empty>Nothing recorded yet.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Admin</Th>
                <Th>Action</Th>
                <Th>Target</Th>
                <Th>Before → after</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <Td muted>{stamp(row.createdAt)}</Td>
                  <Td muted>{row.adminEmail}</Td>
                  <Td>
                    <span className="flex items-center gap-1.5">
                      {ACTION_LABEL[row.action]}
                      {DESTRUCTIVE.includes(row.action) ? (
                        <Badge tone="warn">account</Badge>
                      ) : null}
                    </span>
                  </Td>
                  <Td>
                    {row.targetUserId ? (
                      <Link
                        href={`/admin/users/${row.targetUserId}`}
                        className="text-sky-700 hover:underline dark:text-sky-400"
                      >
                        {row.targetUserEmail ?? row.targetUserId}
                      </Link>
                    ) : (
                      <span className="text-slate-500">
                        {row.targetUserEmail ?? row.targetLabel ?? "—"}
                      </span>
                    )}
                  </Td>
                  <Td muted>
                    {row.beforeState || row.afterState
                      ? `${row.beforeState ?? "—"} → ${row.afterState ?? "—"}`
                      : "—"}
                  </Td>
                  <Td muted>{row.note ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}

        {pages > 1 ? (
          <nav className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {pages}
            </span>
            <span className="flex gap-2">
              {page > 1 ? (
                <Link
                  className="hover:underline"
                  href={`/admin/audit?${action ? `action=${action}&` : ""}page=${page - 1}`}
                >
                  ← Previous
                </Link>
              ) : null}
              {page < pages ? (
                <Link
                  className="hover:underline"
                  href={`/admin/audit?${action ? `action=${action}&` : ""}page=${page + 1}`}
                >
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

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "rounded-full bg-slate-900 px-2.5 py-1 font-medium text-white dark:bg-slate-100 dark:text-slate-900"
          : "rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
      }
    >
      {children}
    </Link>
  );
}

function isAction(value: string | undefined): value is AdminAction {
  return value !== undefined && value in ACTION_LABEL;
}
