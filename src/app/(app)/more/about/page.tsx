import { SubHeader } from "../_SubHeader";
import { Card } from "@/components/ui/primitives";
import { Mascot } from "@/components/ui/Mascot";
import { BRAND, PHRASES } from "@/lib/brand";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <SubHeader title="About & disclaimer" />

      <div className="flex flex-col gap-4 px-5 pb-8">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Mascot size={104} />
          <p className="text-2xl font-extrabold text-charcoal-900">{BRAND.name}</p>
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-charcoal-500">
            {BRAND.tagline}
          </p>
        </div>

        <Card>
          <h2 className="font-extrabold text-charcoal-900">What this app is</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">
            A habit tracker and personal journal for people who want to take cayenne
            consistently. You decide what to log and why. The app keeps the streak,
            draws the charts, and hands you something worth sharing.
          </p>
        </Card>

        <Card>
          <h2 className="font-extrabold text-charcoal-900">
            Wellness &amp; medical disclaimer
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">
            Cayenne Do It does not provide medical advice, diagnosis or treatment, and
            nothing in the app should be taken as a claim that cayenne treats, prevents
            or cures any condition. Goals, measurements and journal entries are your own
            records — the app never attributes changes in them to cayenne.
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-charcoal-500">
            Talk to a qualified healthcare professional before changing your diet or
            routine, especially if you are pregnant, nursing, managing a health
            condition, or taking medication. Stop and seek advice if anything you take
            causes discomfort.
          </p>
        </Card>

        <Card>
          <h2 className="font-extrabold text-charcoal-900">Terms, briefly</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">
            Use the app for your own personal tracking. Don&apos;t abuse it, don&apos;t
            try to reach other people&apos;s data, and don&apos;t rely on it as a
            medical record. The lifetime unlock is a one-time purchase tied to your
            account.
          </p>
        </Card>

        <Card>
          <h2 className="mb-2 font-extrabold text-charcoal-900">Things we say a lot</h2>
          <ul className="flex flex-wrap gap-2">
            {PHRASES.map((phrase) => (
              <li
                key={phrase}
                className="rounded-full bg-cream-100 px-3 py-1.5 text-xs font-bold text-charcoal-700"
              >
                {phrase}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
