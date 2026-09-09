import { SubHeader } from "../_SubHeader";
import { DeleteAccount } from "@/components/DeleteAccount";
import { UpgradeNudge } from "@/components/UpgradeNudge";
import { Card, SectionTitle } from "@/components/ui/primitives";
import { can, FEATURES } from "@/lib/entitlements";
import { requireUser } from "@/server/auth";
import { deleteAccount } from "../settings/actions";

export const metadata = { title: "Privacy & your data" };
export const dynamic = "force-dynamic";

const PRINCIPLES = [
  {
    title: "Nothing is public by default",
    body: "Your entries, journal, notes and measurements are visible to you alone. There is no feed and no profile page.",
  },
  {
    title: "Sharing is opt-in, every time",
    body: "A share card is created only when you tap to make one, and it can only ever contain your streak count, total days, the day's quote and a goal label you choose to add.",
  },
  {
    title: "Health data stays out of share cards",
    body: "Weight, waist, blood pressure, glucose, journal entries and notes are structurally excluded from share cards. There is no setting that adds them.",
  },
  {
    title: "You can take it all with you",
    body: "Export everything as JSON, any time. Deleting your account removes every row we hold about you.",
  },
];

export default async function PrivacyPage() {
  const user = await requireUser();
  const canExport = can(user.entitlement, FEATURES.DATA_EXPORT);

  return (
    <>
      <SubHeader title="Privacy & your data" />

      <div className="flex flex-col gap-4 px-5 pb-8">
        {PRINCIPLES.map((p) => (
          <Card key={p.title}>
            <p className="font-extrabold text-charcoal-900">{p.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal-500">{p.body}</p>
          </Card>
        ))}

        <section>
          <SectionTitle>Export my data</SectionTitle>
          {canExport ? (
            <a
              href="/api/export"
              className="tap flex h-13 items-center justify-center rounded-2xl border border-cream-300 bg-white px-5 font-extrabold text-charcoal-900 shadow-soft"
            >
              Download everything (JSON)
            </a>
          ) : (
            <UpgradeNudge feature={FEATURES.DATA_EXPORT} />
          )}
        </section>

        <section>
          <SectionTitle>Delete my account</SectionTitle>
          <DeleteAccount onDelete={deleteAccount} />
        </section>
      </div>
    </>
  );
}
