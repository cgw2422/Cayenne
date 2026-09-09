import Link from "next/link";

import {
  Badge,
  Empty,
  Metric,
  Panel,
  TableWrap,
  Td,
  Th,
  stamp,
} from "@/components/admin/shell";
import { prisma } from "@/lib/prisma";
import { LIFETIME_PRICE_USD } from "@/lib/entitlements";
import { requireAdminPage } from "@/server/admin/guard";

export const metadata = { title: "Entitlements · Admin" };
export const dynamic = "force-dynamic";

/**
 * Who has paid, who has been comped, and who has had access taken away.
 *
 * Paid and complimentary are kept strictly apart. Comped accounts are real
 * users but they are not revenue, and a page that blends the two produces a
 * number that feels like a business result and isn't one.
 */
export default async function AdminEntitlementsPage() {
  await requireAdminPage();

  const [paid, comped, unattributed, revocations, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where: { entitlement: "LIFETIME", entitlementSource: "PAID" },
      orderBy: { entitledAt: "desc" },
      take: 200,
      select: {
        id: true,
        displayName: true,
        email: true,
        entitledAt: true,
        entitlementProvider: true,
        entitlementNote: true,
      },
    }),
    prisma.user.findMany({
      where: { entitlement: "LIFETIME", entitlementSource: "COMPLIMENTARY" },
      orderBy: { entitledAt: "desc" },
      take: 200,
      select: {
        id: true,
        displayName: true,
        email: true,
        entitledAt: true,
        entitlementProvider: true,
        entitlementNote: true,
      },
    }),
    prisma.user.count({
      where: { entitlement: "LIFETIME", entitlementSource: null },
    }),
    prisma.adminAuditLog.findMany({
      where: { action: "REVOKE_LIFETIME" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.count(),
  ]);

  const revenue = paid.length * LIFETIME_PRICE_USD;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Entitlements</h1>
        <p className="text-xs text-slate-500">
          Lifetime is ${LIFETIME_PRICE_USD.toFixed(2)}, once. There is no
          subscription to reconcile.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Paid lifetime" value={paid.length} tone="good" />
        <Metric label="Complimentary" value={comped.length} tone="warn" />
        <Metric label="Free" value={totalUsers - paid.length - comped.length - unattributed} />
        <Metric
          label="Gross, at list price"
          value={`$${revenue.toFixed(2)}`}
          hint="Paid grants × list price"
        />
      </div>

      {unattributed > 0 ? (
        <Panel>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {unattributed} lifetime account{unattributed === 1 ? " has" : "s have"} no
            recorded source. Those predate this page; open each one and re-grant to
            mark it paid or complimentary.
          </p>
        </Panel>
      ) : null}

      <Panel title={`Paid lifetime · ${paid.length}`}>
        <Holders rows={paid} empty="Nothing sold yet." />
      </Panel>

      <Panel title={`Complimentary lifetime · ${comped.length}`}>
        <Holders rows={comped} empty="Nobody comped yet." showNote />
      </Panel>

      <Panel title="Access removed">
        {revocations.length === 0 ? (
          <Empty>Lifetime has never been taken away.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Account</Th>
                <Th>Admin</Th>
                <Th>Was</Th>
                <Th>Reason</Th>
              </tr>
            </thead>
            <tbody>
              {revocations.map((row) => (
                <tr key={row.id}>
                  <Td muted>{stamp(row.createdAt)}</Td>
                  <Td>
                    {row.targetUserId ? (
                      <Link
                        href={`/admin/users/${row.targetUserId}`}
                        className="text-sky-700 hover:underline dark:text-sky-400"
                      >
                        {row.targetUserEmail}
                      </Link>
                    ) : (
                      row.targetUserEmail ?? "—"
                    )}
                  </Td>
                  <Td muted>{row.adminEmail}</Td>
                  <Td muted>{row.beforeState ?? "—"}</Td>
                  <Td muted>{row.note ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}

type Holder = {
  id: string;
  displayName: string;
  email: string;
  entitledAt: Date | null;
  entitlementProvider: string | null;
  entitlementNote: string | null;
};

function Holders({
  rows,
  empty,
  showNote,
}: {
  rows: Holder[];
  empty: string;
  showNote?: boolean;
}) {
  if (rows.length === 0) return <Empty>{empty}</Empty>;
  return (
    <TableWrap>
      <thead>
        <tr>
          <Th>Account</Th>
          <Th>Granted</Th>
          <Th>Provider</Th>
          {showNote ? <Th>Why</Th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((user) => (
          <tr key={user.id}>
            <Td>
              <Link
                href={`/admin/users/${user.id}`}
                className="font-medium text-sky-700 hover:underline dark:text-sky-400"
              >
                {user.displayName}
              </Link>
              <span className="block text-xs text-slate-500">{user.email}</span>
            </Td>
            <Td muted>{stamp(user.entitledAt)}</Td>
            <Td muted>
              {user.entitlementProvider ? (
                <Badge>{user.entitlementProvider}</Badge>
              ) : (
                "—"
              )}
            </Td>
            {showNote ? <Td muted>{user.entitlementNote ?? "—"}</Td> : null}
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}
