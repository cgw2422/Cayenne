import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Badge,
  Empty,
  Metric,
  Panel,
  TableWrap,
  Td,
  Th,
  shortDate,
  stamp,
} from "@/components/admin/shell";
import { UserActions } from "@/components/admin/UserActions";
import { ACTION_LABEL } from "@/server/admin/audit";
import { requireAdminPage } from "@/server/admin/guard";
import { auditForUser, getUserDetail } from "@/server/admin/users";
import { EntitlementBadge } from "../page";
import {
  forcePasswordReset,
  grantLifetimeTo,
  revokeLifetimeFrom,
  setAccountDisabled,
} from "../actions";

export const metadata = { title: "User · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPage();
  const { id } = await params;

  const [user, audit] = await Promise.all([getUserDetail(id), auditForUser(id)]);
  if (!user) notFound();

  const completed = user.challenges.filter((c) => c.status === "COMPLETED").length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link href="/admin/users" className="text-xs text-slate-500 hover:underline">
          ← All users
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold">{user.displayName}</h1>
          <EntitlementBadge
            entitlement={user.entitlement}
            source={user.entitlementSource}
          />
          {user.role === "PLATFORM_ADMIN" ? <Badge tone="info">Platform admin</Badge> : null}
          {user.disabledAt ? <Badge tone="bad">Disabled</Badge> : null}
          {user.passwordResetAt ? <Badge tone="warn">Password reset pending</Badge> : null}
        </div>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Days logged" value={user.profile?.totalDays ?? 0} />
        <Metric label="Current streak" value={user.profile?.currentStreak ?? 0} />
        <Metric label="Longest streak" value={user.profile?.longestStreak ?? 0} />
        <Metric label="Share cards" value={user._count.shareCards} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Account">
          <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
            <Row label="Signed up">{stamp(user.createdAt)}</Row>
            <Row label="Onboarded">{user.onboardedAt ? stamp(user.onboardedAt) : "Not finished"}</Row>
            <Row label="Last active">{user.lastSeenAt ? stamp(user.lastSeenAt) : "Never"}</Row>
            <Row label="Last logged">{shortDate(user.profile?.lastLoggedOn)}</Row>
            <Row label="Started on">{shortDate(user.profile?.startedOn)}</Row>
            <Row label="Timezone">{user.profile?.timezone ?? "—"}</Row>
            <Row label="Doses / day">{user.profile?.dosesPerDay ?? 1}</Row>
            <Row label="Total entries">{user._count.entries.toLocaleString()}</Row>
            <Row label="Recipes written">{user._count.recipes}</Row>
            {user.disabledAt ? <Row label="Disabled">{stamp(user.disabledAt)}</Row> : null}
          </dl>
          <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800">
            Weight, blood pressure, glucose, body measurements, journal entries and
            share photos are not read by this page. They are never queried, not
            fetched and hidden.
          </p>
        </Panel>

        <Panel title="Entitlement">
          <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
            <Row label="Status">{user.entitlement}</Row>
            <Row label="Kind">{user.entitlementSource ?? "—"}</Row>
            <Row label="Provider">{user.entitlementProvider ?? "—"}</Row>
            <Row label="Granted">{user.entitledAt ? stamp(user.entitledAt) : "—"}</Row>
            <Row label="Note">{user.entitlementNote ?? "—"}</Row>
          </dl>

          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Actions
            </p>
            <UserActions
              userId={user.id}
              isLifetime={user.entitlement === "LIFETIME"}
              isDisabled={user.disabledAt !== null}
              isSelf={user.id === admin.id}
              onGrant={grantLifetimeTo}
              onRevoke={revokeLifetimeFrom}
              onSetDisabled={setAccountDisabled}
              onForceReset={forcePasswordReset}
            />
          </div>
        </Panel>

        <Panel title={`Challenges · ${completed} completed`}>
          {user.challenges.length === 0 ? (
            <Empty>No challenges started.</Empty>
          ) : (
            <ul className="grid gap-2 text-sm">
              {user.challenges.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3">
                  <span>
                    {entry.challenge.title}
                    <span className="block text-xs text-slate-500">
                      {entry.challenge.durationDays} days · started{" "}
                      {shortDate(entry.startedOn)}
                    </span>
                  </span>
                  <Badge
                    tone={
                      entry.status === "COMPLETED"
                        ? "good"
                        : entry.status === "ACTIVE"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {entry.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Achievements · ${user.achievements.length}`}>
          {user.achievements.length === 0 ? (
            <Empty>None unlocked yet.</Empty>
          ) : (
            <ul className="grid gap-1.5 text-sm">
              {user.achievements.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3">
                  <span>{entry.achievement.title}</span>
                  <span className="text-xs text-slate-500">
                    {shortDate(entry.unlockedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Admin history for this account">
        {audit.length === 0 ? (
          <Empty>Nothing has been done to this account.</Empty>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Admin</Th>
                <Th>Action</Th>
                <Th>Before → after</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody>
              {audit.map((row) => (
                <tr key={row.id}>
                  <Td muted>{stamp(row.createdAt)}</Td>
                  <Td muted>{row.adminEmail}</Td>
                  <Td>{ACTION_LABEL[row.action]}</Td>
                  <Td muted>
                    {row.beforeState ?? "—"} → {row.afterState ?? "—"}
                  </Td>
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 dark:text-slate-200">{children}</dd>
    </>
  );
}
