import { SubHeader } from "../_SubHeader";
import { MeasurementForm } from "@/components/MeasurementForm";
import { LineChart } from "@/components/charts/LineChart";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { Card, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { dayKeyFromDateColumn, formatDayShort } from "@/lib/date";
import { can, FEATURES } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { userToday } from "@/server/habit";
import { saveMeasurement } from "./actions";

export const metadata = { title: "Measurements" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  WEIGHT: "Weight",
  WAIST: "Waist",
  BLOOD_PRESSURE: "Blood pressure",
  BLOOD_GLUCOSE: "Blood glucose",
  CUSTOM: "Custom",
};

export default async function MeasurementsPage() {
  const user = await requireUser();
  const unlocked = can(user.entitlement, FEATURES.MEASUREMENTS);
  const today = userToday(user);

  const measurements = unlocked
    ? await prisma.measurement.findMany({
        where: { userId: user.id },
        orderBy: { recordedOn: "asc" },
        take: 500,
      })
    : [];

  const byKind = new Map<string, typeof measurements>();
  for (const m of measurements) {
    const key = m.kind === "CUSTOM" ? `CUSTOM:${m.customLabel ?? ""}` : m.kind;
    byKind.set(key, [...(byKind.get(key) ?? []), m]);
  }

  return (
    <>
      <SubHeader title="Measurements" />

      <div className="flex flex-col gap-4 px-5 pb-8">
        <div className="rounded-2xl border border-cream-300 bg-cream-100/70 px-4 py-3.5">
          <p className="text-sm leading-relaxed text-charcoal-700">
            These are your own notes, for your own tracking. Cayenne Do It doesn&apos;t
            interpret them, doesn&apos;t attribute changes to cayenne, and doesn&apos;t
            provide medical advice. Talk to a clinician about anything health-related.
          </p>
        </div>

        {unlocked ? (
          <>
            <MeasurementForm today={today} onSave={saveMeasurement} />

            {byKind.size === 0 ? (
              <EmptyState
                mascot={<Mascot pose="rest" size={80} />}
                title="Nothing recorded yet"
                body="Track only what you actually care about. One number, whenever you feel like it, is enough to see a trend later."
              />
            ) : (
              [...byKind.entries()].map(([key, rows]) => {
                const label = key.startsWith("CUSTOM:")
                  ? key.slice(7) || "Custom"
                  : KIND_LABEL[key];
                const latest = rows[rows.length - 1];
                return (
                  <section key={key}>
                    <SectionTitle>{label}</SectionTitle>
                    <Card>
                      <p className="mb-3 text-2xl font-extrabold text-charcoal-900">
                        {Number(latest.value)}
                        {latest.secondary ? `/${Number(latest.secondary)}` : ""}{" "}
                        <span className="text-base font-bold text-charcoal-500">
                          {latest.unit}
                        </span>
                      </p>
                      <LineChart
                        points={rows.map((r) => ({
                          x: dayKeyFromDateColumn(r.recordedOn),
                          y: Number(r.value),
                          label: formatDayShort(dayKeyFromDateColumn(r.recordedOn)),
                        }))}
                        accent="#12372A"
                        format={{ kind: "unit", unit: latest.unit, decimals: 2 }}
                        ariaLabel={`${label} over time`}
                      />
                      <p className="mt-2 text-xs text-charcoal-500">
                        {rows.length} {rows.length === 1 ? "entry" : "entries"}. Trends
                        only — no conclusions drawn.
                      </p>
                    </Card>
                  </section>
                );
              })
            )}
          </>
        ) : (
          <UpgradeNudge feature={FEATURES.MEASUREMENTS} />
        )}
      </div>
    </>
  );
}
