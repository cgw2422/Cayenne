import { Badge, Panel } from "@/components/admin/shell";
import { requireAdminPage } from "@/server/admin/guard";
import { systemReport, type Check } from "@/server/admin/system";

export const metadata = { title: "System · Admin" };
export const dynamic = "force-dynamic";

const STATE: Record<Check["state"], { tone: "good" | "warn" | "bad" | "neutral"; text: string }> = {
  ok: { tone: "good", text: "OK" },
  warn: { tone: "warn", text: "Slow" },
  down: { tone: "bad", text: "Down" },
  off: { tone: "neutral", text: "Not configured" },
};

export default async function AdminSystemPage() {
  await requireAdminPage();
  const report = await systemReport();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">System</h1>
        <p className="text-xs text-slate-500">
          Whether things are configured and reachable — never what they are
          configured with.
        </p>
      </div>

      <Panel title="Build">
        <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <Row label="Environment">
            <Badge tone={/^prod/i.test(report.environment) ? "bad" : "neutral"}>
              {report.environment}
            </Badge>
          </Row>
          <Row label="NODE_ENV">{report.nodeEnv}</Row>
          <Row label="Node">{report.nodeVersion}</Row>
          <Row label="Commit">
            {report.commit ? (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
                {report.commit}
              </code>
            ) : (
              <span className="text-slate-500">
                Not available — set BUILD_TIMESTAMP and a commit SHA at build time
              </span>
            )}
          </Row>
          <Row label="Built at">
            {report.builtAt ?? <span className="text-slate-500">Not available</span>}
          </Row>
          <Row label="Region">
            {report.region ?? <span className="text-slate-500">—</span>}
          </Row>
        </dl>
      </Panel>

      <Panel title="Services">
        <ul className="grid gap-2">
          {report.checks.map((check) => (
            <li
              key={check.label}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0 dark:border-slate-800"
            >
              <span className="text-sm font-medium">{check.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{check.detail}</span>
                <Badge tone={STATE[check.state].tone}>{STATE[check.state].text}</Badge>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Database">
        <dl className="grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <Row label="Migrations applied">
            {report.counts.migrations ?? "Unknown"}
          </Row>
          <Row label="Days rolled up">{report.counts.dailyStats ?? "Unknown"}</Row>
        </dl>
        <p className="mt-3 border-t border-slate-200 pt-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800">
          This page reads no secret. Credentials, API keys, tokens, connection
          strings and environment variable values are never loaded into anything
          it can render — configured services are reported as a boolean and a
          live health check.
        </p>
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
