"use client";

import { useState, useTransition } from "react";

import { Button, Card, cx } from "@/components/ui/primitives";
import { Toggle } from "@/components/Onboarding";
import type { PublishResult } from "@/app/(app)/share/actions";

type VariantOption = {
  key: string;
  label: string;
  headline: string;
  subline: string;
  available: boolean;
};

export function ShareStudio({
  options,
  streak,
  totalDays,
  quote,
  goalLabel,
  onPublish,
}: {
  options: VariantOption[];
  streak: number;
  totalDays: number;
  quote: string | null;
  goalLabel: string | null;
  onPublish: (input: {
    variant: string;
    includeQuote: boolean;
    includeGoal: boolean;
  }) => Promise<PublishResult>;
}) {
  const usable = options.filter((o) => o.available);
  const [variant, setVariant] = useState(usable[0]?.key ?? "STREAK");
  const [includeQuote, setIncludeQuote] = useState(Boolean(quote));
  const [includeGoal, setIncludeGoal] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [copied, setCopied] = useState<"link" | "image" | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = options.find((o) => o.key === variant) ?? usable[0];

  function publish(then?: (r: PublishResult) => void) {
    startTransition(async () => {
      const r = await onPublish({ variant, includeQuote, includeGoal });
      setResult(r);
      if (r.ok) then?.(r);
    });
  }

  async function share() {
    publish(async (r) => {
      if (!r.ok) return;
      const absolute = new URL(r.imageUrl, window.location.origin).toString();
      try {
        const response = await fetch(absolute);
        const blob = await response.blob();
        const file = new File([blob], "cayenne-do-it.png", { type: "image/png" });

        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Cayenne Do It",
            text: `${selected?.headline} — Small habit. Big fire.`,
          });
          return;
        }
        if (navigator.share) {
          await navigator.share({ title: "Cayenne Do It", url: r.url });
          return;
        }
        window.open(absolute, "_blank", "noopener");
      } catch {
        window.open(absolute, "_blank", "noopener");
      }
    });
  }

  async function copyLink() {
    publish(async (r) => {
      if (!r.ok) return;
      try {
        await navigator.clipboard.writeText(r.url);
        setCopied("link");
        setTimeout(() => setCopied(null), 2200);
      } catch {
        /* clipboard blocked — the link is still shown below */
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 px-5 pb-8">
      {/* -------------------------------------------------------- preview -- */}
      <div className="overflow-hidden rounded-[1.75rem] shadow-lift">
        {/* Mirrors the published PNG so the preview is honest. */}
        <div
          className="relative flex aspect-square flex-col items-center justify-between px-6 py-7 text-center"
          style={{
            backgroundImage:
              "linear-gradient(158deg,#C0291C 0%,#8E2317 22%,#3A3A25 45%,#16412F 68%,#0B211A 100%)",
          }}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-[0.36em] text-cream-100/75">
            Cayenne Do It
          </p>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
            <span className="text-2xl leading-none">🔥</span>

            <p
              className={cx(
                "font-extrabold leading-[0.98] tracking-tight text-cream-100",
                (selected?.headline.length ?? 0) > 20 ? "text-[26px]" : "text-[32px]",
              )}
            >
              {selected?.headline}
            </p>

            <p className="text-[15px] font-extrabold text-ember-400">
              {selected?.subline}
            </p>

            {includeQuote && quote ? (
              <p className="line-clamp-2 max-w-[16rem] text-[13px] leading-snug text-cream-100/70">
                &ldquo;{quote}&rdquo;
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <PreviewStat label="Day streak" value={streak} />
              <PreviewStat label="Total days" value={totalDays} />
              {includeGoal && goalLabel ? (
                <PreviewStat label="Working on" value={goalLabel} />
              ) : null}
            </div>
          </div>

          <div>
            <p className="text-base font-extrabold leading-tight text-cream-100">
              Cayenne Do It
            </p>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-cream-100/55">
              Small habit. Big fire.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- variants -- */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            disabled={!option.available}
            aria-pressed={variant === option.key}
            onClick={() => {
              setVariant(option.key);
              setResult(null);
            }}
            className={cx(
              "shrink-0 rounded-full border-2 px-4 py-2 text-sm font-extrabold transition-all",
              variant === option.key
                ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                : "border-cream-300 bg-white text-charcoal-700",
              !option.available && "opacity-40",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* -------------------------------------------------------- options -- */}
      <Card className="grid gap-4">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
          What goes on the card
        </p>

        <Row
          label="Today's quote"
          hint={quote ?? "No quote yet — log a day first."}
          disabled={!quote}
          on={includeQuote && Boolean(quote)}
          onChange={(v) => {
            setIncludeQuote(v);
            setResult(null);
          }}
        />
        <Row
          label="One of my goals"
          hint={goalLabel ?? "You haven't picked any goals."}
          disabled={!goalLabel}
          on={includeGoal && Boolean(goalLabel)}
          onChange={(v) => {
            setIncludeGoal(v);
            setResult(null);
          }}
        />

        <p className="border-t border-cream-200 pt-3.5 text-xs leading-relaxed text-charcoal-500">
          Your journal, notes, moods and any measurements are never included on a
          share card. Only what you see in the preview is published.
        </p>
      </Card>

      {/* --------------------------------------------------------- actions -- */}
      <div className="grid gap-2.5">
        <Button size="lg" full onClick={share} disabled={pending}>
          {pending ? "Making your card…" : "Share image"}
        </Button>
        <Button variant="secondary" size="lg" full onClick={copyLink} disabled={pending}>
          {copied === "link" ? "Link copied ✓" : "Copy link"}
        </Button>
        {result?.ok ? (
          <a
            href={`/api/share/${result.token}/image?format=square`}
            target="_blank"
            rel="noopener"
            className="tap flex h-12 items-center justify-center rounded-2xl border border-cream-300 bg-white text-[15px] font-extrabold text-charcoal-700"
          >
            Open full-size image
          </a>
        ) : null}
      </div>

      {result?.ok ? (
        <p className="break-all rounded-2xl bg-cream-200/60 px-4 py-3 text-center text-xs font-semibold text-charcoal-500">
          {result.url}
        </p>
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className="text-center text-sm font-bold text-cayenne-700">
          {result.message}
        </p>
      ) : null}

      <p className="text-center text-xs leading-relaxed text-charcoal-500">
        A little heat today. A brighter tomorrow.
      </p>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-cream-100/20 bg-cream-100/10 px-3.5 py-2">
      <p className="text-lg font-extrabold leading-none text-cream-100">{value}</p>
      <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.16em] text-cream-100/60">
        {label}
      </p>
    </div>
  );
}

function Row({
  label,
  hint,
  on,
  disabled,
  onChange,
}: {
  label: string;
  hint: string;
  on: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={cx("flex items-center justify-between gap-4", disabled && "opacity-45")}>
      <div className="min-w-0">
        <p className="font-extrabold text-charcoal-900">{label}</p>
        <p className="truncate text-xs text-charcoal-500">{hint}</p>
      </div>
      {disabled ? (
        <span className="h-8 w-14 shrink-0 rounded-full bg-cream-300" aria-hidden="true" />
      ) : (
        <Toggle on={on} onChange={onChange} label={label} />
      )}
    </div>
  );
}
