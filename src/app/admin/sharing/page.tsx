import { Empty, Metric, Panel, TableWrap, Td, Th } from "@/components/admin/shell";
import { requireAdminPage } from "@/server/admin/guard";
import { sharingReport, type Breakdown } from "@/server/admin/sharing";

export const metadata = { title: "Sharing · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminSharingPage() {
  await requireAdminPage();
  const report = await sharingReport();

  const step = (event: string) =>
    report.funnel.find((s) => s.event === event)?.count ?? 0;

  const opens = step("STUDIO_OPENED");
  const generated = step("IMAGE_GENERATED");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Sharing</h1>
        <p className="text-xs text-slate-500">
          What happened inside the app. Where an image ended up afterwards is not
          recorded — the share sheet doesn&apos;t report a destination and we
          don&apos;t infer one.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Studio opens" value={opens} />
        <Metric label="Images generated" value={generated} />
        <Metric label="Images saved" value={step("IMAGE_SAVED")} />
        <Metric label="Captions copied" value={step("CAPTION_COPIED")} />
        <Metric label="Native share taps" value={step("NATIVE_SHARE_CLICKED")} />
        <Metric label="Facebook taps" value={step("FACEBOOK_SHARE_CLICKED")} tone="good" />
        <Metric label="Wording changed" value={step("WORDING_CHANGED")} />
        <Metric
          label="Open → generate"
          value={opens ? `${Math.round((generated / opens) * 100)}%` : "—"}
          hint="Studio opens that produced a card"
        />
      </div>

      <Panel title="Funnel">
        {opens === 0 ? (
          <Empty>Nobody has opened the Share Studio yet.</Empty>
        ) : (
          <ul className="grid gap-2">
            {report.funnel.map((entry) => (
              <li key={entry.event} className="grid gap-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{entry.label}</span>
                  <span className="tabular-nums font-medium">
                    {entry.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded bg-slate-900 dark:bg-slate-100"
                    style={{ width: `${opens ? Math.min(100, (entry.count / opens) * 100) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Card type">
          <Ranked rows={report.kinds} total={report.totalCards} />
        </Panel>
        <Panel title="Template">
          <Ranked rows={report.themes} total={report.totalCards} />
        </Panel>
        <Panel title="Personality">
          <Ranked rows={report.tones} total={report.totalCards} />
        </Panel>
      </div>

      <Panel title="Sharing by streak milestone">
        {report.totalCards === 0 ? (
          <Empty>No cards published yet.</Empty>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>Milestone</Th>
                  <Th numeric>Cards</Th>
                  <Th numeric>Share of milestone cards</Th>
                </tr>
              </thead>
              <tbody>
                {report.milestones.map((row) => (
                  <tr key={row.key}>
                    <Td>{row.label}</Td>
                    <Td numeric>{row.count.toLocaleString()}</Td>
                    <Td numeric muted>{row.pct}%</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <p className="mt-2 text-xs text-slate-500">
              A card counts towards a milestone when it was published with a streak
              of that many days up to two days past — people share the evening of,
              or the morning after.
            </p>
          </>
        )}
      </Panel>
    </div>
  );
}

function Ranked({ rows, total }: { rows: Breakdown[]; total: number }) {
  if (total === 0) return <Empty>Nothing yet.</Empty>;
  return (
    <ul className="grid gap-2 text-sm">
      {rows.map((row, index) => (
        <li key={row.key} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={index === 0 ? "font-medium" : "text-slate-600 dark:text-slate-400"}>
              {row.label}
              {index === 0 ? " ★" : ""}
            </span>
            <span className="tabular-nums text-xs text-slate-500">
              {row.count.toLocaleString()} · {row.pct}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded bg-slate-900 dark:bg-slate-100"
              style={{ width: `${row.pct}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
