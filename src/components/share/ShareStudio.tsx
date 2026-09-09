"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import { Button, Card, cx } from "@/components/ui/primitives";
import { Toggle } from "@/components/Onboarding";
import { CAPTION_STYLES, CAPTION_STYLE_LABEL, type CaptionStyle } from "@/lib/share/captions";
import { DEFAULT_TONE, TONES, TONE_BLURB, TONE_LABEL, type Tone } from "@/lib/share/voice";

import {
  DEFAULT_TOGGLES,
  KIND_META,
  KIND_TOGGLES,
  SHARE_KINDS,
  SIZES,
  THEME_IDS,
  THEME_LABEL,
  TOGGLE_LABEL,
  type ShareKind,
  type ShareToggles,
  type SizeId,
  type ThemeId,
} from "@/lib/share/types";
import type { PublishInput, PublishResult } from "@/app/(app)/share/actions";

type Availability = {
  challenge: boolean;
  achievement: boolean;
  quote: boolean;
  amount: boolean;
  method: boolean;
};

type QuoteChoice = { id: string; text: string };

export function ShareStudio({
  initialKind,
  initialTheme,
  achievementId,
  todaysQuote,
  quotes,
  available,
  onPublish,
  onTrack,
}: {
  initialKind: ShareKind | null;
  initialTheme: ThemeId;
  achievementId: string | null;
  todaysQuote: string | null;
  quotes: QuoteChoice[];
  available: Availability;
  onPublish: (input: PublishInput) => Promise<PublishResult>;
  onTrack: (input: {
    event: string;
    kind?: string | null;
    theme?: string | null;
    size?: string | null;
    captionStyle?: string | null;
  }) => Promise<{ ok: boolean }>;
}) {
  const [kind, setKind] = useState<ShareKind | null>(initialKind);
  const [theme, setTheme] = useState<ThemeId>(initialTheme);
  const [size, setSize] = useState<SizeId>("FACEBOOK");
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE);
  const [toggles, setToggles] = useState<ShareToggles>(DEFAULT_TOGGLES);
  const [quoteMode, setQuoteMode] = useState<"today" | "custom" | "none">("today");
  const [customQuote, setCustomQuote] = useState<string>(quotes[0]?.text ?? "");
  const [result, setResult] = useState<PublishResult | null>(null);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>("CASUAL");
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  useEffect(() => {
    void onTrack({ event: "STUDIO_OPENED", kind: initialKind });
    // Fires once per studio visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Three states, matching the stats builder exactly: today's quote (send
  // nothing), no quote, or a chosen one. Preview and publish must agree or the
  // exported card won't match what the user approved.
  const quoteParam =
    quoteMode === "none" ? "" : quoteMode === "custom" ? customQuote : null;
  const quoteForPublish =
    quoteMode === "today" ? undefined : quoteMode === "none" ? null : customQuote;

  /** The preview is the real renderer, so what you see is what exports. */
  const previewSrc = useMemo(() => {
    if (!kind) return null;
    const on = (Object.keys(toggles) as (keyof ShareToggles)[])
      .filter((k) => toggles[k])
      .join(",");
    const params = new URLSearchParams({ kind, theme, size, tone, on, scale: "0.5" });
    if (quoteParam !== null) params.set("quote", quoteParam);
    if (achievementId) params.set("achievement", achievementId);
    return `/api/share/preview?${params.toString()}`;
  }, [kind, theme, size, tone, toggles, quoteParam, achievementId]);

  function thumbSrc(t: ThemeId) {
    if (!kind) return "";
    const on = (Object.keys(toggles) as (keyof ShareToggles)[])
      .filter((k) => toggles[k])
      .join(",");
    const params = new URLSearchParams({ kind, theme: t, size, tone, on, scale: "0.14" });
    if (quoteParam !== null) params.set("quote", quoteParam);
    if (achievementId) params.set("achievement", achievementId);
    return `/api/share/preview?${params.toString()}`;
  }

  // ------------------------------------------------------------- step one --
  if (!kind) {
    return (
      <div className="flex flex-col gap-4 px-5 pb-8 pt-2">
        <p className="text-[15px] leading-relaxed text-charcoal-500">
          What do you want to share?
        </p>
        <ul className="grid gap-2.5">
          {SHARE_KINDS.map((k) => {
            const meta = KIND_META[k];
            const disabled =
              (k === "CHALLENGE" && !available.challenge) ||
              (k === "ACHIEVEMENT" && !available.achievement) ||
              (k === "PEP_TALK" && !available.quote);
            return (
              <li key={k}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setKind(k);
                    setToggles(togglesForKind(k, available));
                    void onTrack({ event: "TYPE_SELECTED", kind: k });
                  }}
                  className={cx(
                    "tap flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                    disabled
                      ? "border-cream-300 bg-cream-100/60 opacity-55"
                      : "border-cream-300 bg-white hover:border-cayenne-300",
                  )}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-cream-100 text-xl">
                    {meta.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold text-charcoal-900">
                      {meta.label}
                    </span>
                    <span className="block truncate text-sm text-charcoal-500">
                      {disabled ? unavailableReason(k) : meta.blurb}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // ------------------------------------------------------------- step two --
  const relevant = KIND_TOGGLES[kind];

  return (
    <div className="flex flex-col gap-5 px-5 pb-8 pt-2">
      <button
        type="button"
        onClick={() => {
          setKind(null);
          setResult(null);
        }}
        className="self-start text-sm font-extrabold text-cayenne-600 underline underline-offset-2"
      >
        ← {KIND_META[kind].label}
      </button>

      {/* --------------------------------------------------------- preview -- */}
      <div className="overflow-hidden rounded-[1.5rem] bg-cream-200/60 shadow-lift">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={previewSrc}
            src={previewSrc}
            alt={`${KIND_META[kind].label} card preview`}
            className="w-full"
            style={{ aspectRatio: `${SIZES[size].width} / ${SIZES[size].height}` }}
          />
        ) : null}
      </div>

      {/* ------------------------------------------------------- templates -- */}
      <section>
        <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
          Template
        </p>
        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
          {THEME_IDS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => {
                setTheme(t);
                void onTrack({ event: "TEMPLATE_SELECTED", kind, theme: t, size });
              }}
              className={cx(
                "shrink-0 overflow-hidden rounded-2xl border-2 transition-all",
                theme === t ? "border-cayenne-600" : "border-cream-300",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbSrc(t)}
                alt=""
                className="block w-[84px]"
                style={{ aspectRatio: `${SIZES[size].width} / ${SIZES[size].height}` }}
              />
              <span
                className={cx(
                  "block px-2 py-1.5 text-[10px] font-extrabold",
                  theme === t ? "bg-cayenne-50 text-cayenne-700" : "bg-white text-charcoal-500",
                )}
              >
                {THEME_LABEL[t]}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- sizes -- */}
      <section>
        <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
          Size
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(SIZES) as SizeId[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                setResult(null);
              }}
              className={cx(
                "tap flex flex-col items-center gap-0.5 rounded-2xl border-2 py-2.5 transition-all",
                size === s
                  ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                  : "border-cream-300 bg-white text-charcoal-700",
              )}
            >
              <span className="text-xs font-extrabold">{SIZES[s].short}</span>
              <span className="text-[9px] font-bold text-charcoal-500">
                {SIZES[s].width}×{SIZES[s].height}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- personality -- */}
      <Card className="grid gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            Make it personal
          </p>
          <p className="mt-1 text-xs text-charcoal-500">
            Changes how the card sounds. Your numbers stay exactly the same.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tone === t}
              onClick={() => {
                setTone(t);
                setResult(null);
              }}
              className={cx(
                "tap rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-[0.98]",
                tone === t
                  ? "border-cayenne-600 bg-cayenne-50"
                  : "border-cream-300 bg-white",
              )}
            >
              <span
                className={cx(
                  "block text-sm font-extrabold",
                  tone === t ? "text-cayenne-700" : "text-charcoal-900",
                )}
              >
                {TONE_LABEL[t]}
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-charcoal-500">
                {TONE_BLURB[t]}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* --------------------------------------------------------- content -- */}
      <Card className="grid gap-3.5">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
          What appears
        </p>
        {relevant
          .filter((key) => key !== "quote")
          .map((key) => {
            const disabled =
              (key === "amount" && !available.amount) ||
              (key === "method" && !available.method) ||
              (key === "challenge" && !available.challenge) ||
              (key === "achievement" && !available.achievement);
            return (
              <label
                key={key}
                className={cx(
                  "flex items-center justify-between gap-4",
                  disabled && "opacity-45",
                )}
              >
                <span className="font-bold text-charcoal-900">{TOGGLE_LABEL[key]}</span>
                {disabled ? (
                  <span className="h-8 w-14 shrink-0 rounded-full bg-cream-300" />
                ) : (
                  <Toggle
                    on={toggles[key]}
                    onChange={(v) => {
                      setToggles((prev) => ({ ...prev, [key]: v }));
                      setResult(null);
                    }}
                    label={TOGGLE_LABEL[key]}
                  />
                )}
              </label>
            );
          })}

        <p className="border-t border-cream-200 pt-3 text-xs leading-relaxed text-charcoal-500">
          Weight, blood pressure, glucose, body measurements and journal notes are
          never available to a card. There is no setting that adds them.
        </p>
      </Card>

      {/* ----------------------------------------------------------- quote -- */}
      {relevant.includes("quote") ? (
        <Card className="grid gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            Quote
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["today", "Today's"],
                ["custom", "Choose"],
                ["none", "None"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={quoteMode === mode}
                disabled={mode === "today" && !available.quote}
                onClick={() => {
                  setQuoteMode(mode);
                  setToggles((prev) => ({ ...prev, quote: mode !== "none" }));
                  setResult(null);
                }}
                className={cx(
                  "tap rounded-2xl border-2 py-2.5 text-sm font-extrabold transition-all disabled:opacity-40",
                  quoteMode === mode
                    ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                    : "border-cream-300 bg-white text-charcoal-700",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {quoteMode === "today" && todaysQuote ? (
            <p className="text-sm italic text-charcoal-500">&ldquo;{todaysQuote}&rdquo;</p>
          ) : null}

          {quoteMode === "custom" ? (
            <select
              value={customQuote}
              onChange={(e) => {
                setCustomQuote(e.target.value);
                setResult(null);
              }}
              aria-label="Choose a quote"
              className="h-12 rounded-2xl border border-cream-300 bg-white px-3 text-[15px] outline-none focus:border-ember-400"
            >
              {quotes.map((q) => (
                <option key={q.id} value={q.text}>
                  {q.text}
                </option>
              ))}
            </select>
          ) : null}
        </Card>
      ) : null}

      {/* --------------------------------------------------------- actions -- */}
      <div className="grid gap-2.5">
        <Button
          size="lg"
          full
          disabled={busy}
          onClick={() =>
            startTransition(async () => {
              const r = await publish();
              if (!r?.ok) return;
              void onTrack({ event: "NATIVE_SHARE_CLICKED", kind, theme, size });
              await nativeShare(r);
            })
          }
        >
          {busy ? "Making your card…" : "Share image"}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          full
          disabled={busy}
          onClick={() =>
            startTransition(async () => {
              const r = await publish();
              if (!r?.ok) return;
              void onTrack({ event: "IMAGE_SAVED", kind, theme, size });
              await saveImage(r);
            })
          }
        >
          Save image
        </Button>
      </div>

      {/* -------------------------------------------------------- captions -- */}
      {result?.ok ? (
        <Card className="grid gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            Caption
          </p>
          <div className="grid grid-cols-4 gap-2">
            {CAPTION_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                aria-pressed={captionStyle === style}
                onClick={() => setCaptionStyle(style)}
                className={cx(
                  "tap rounded-xl border-2 py-2 text-[11px] font-extrabold transition-all",
                  captionStyle === style
                    ? "border-cayenne-600 bg-cayenne-50 text-cayenne-700"
                    : "border-cream-300 bg-white text-charcoal-700",
                )}
              >
                {CAPTION_STYLE_LABEL[style]}
              </button>
            ))}
          </div>
          <p className="rounded-2xl bg-cream-100 px-4 py-3 text-[15px] leading-relaxed text-charcoal-900">
            {result.captions[captionStyle]}
          </p>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(result.captions[captionStyle]);
                setCopied("caption");
                setTimeout(() => setCopied(null), 2200);
                void onTrack({ event: "CAPTION_COPIED", kind, theme, size, captionStyle });
              } catch {
                /* clipboard blocked — the caption is selectable above */
              }
            }}
          >
            {copied === "caption" ? "Caption copied ✓" : "Copy caption"}
          </Button>

          <p className="break-all border-t border-cream-200 pt-3 text-center text-xs text-charcoal-500">
            {result.url}
          </p>
        </Card>
      ) : null}
    </div>
  );

  async function publish() {
    const r = await onPublish({
      kind: kind!,
      theme,
      size,
      toggles,
      quote: quoteForPublish,
      tone,
      achievementId,
    });
    setResult(r);
    return r;
  }
}

/** Sensible defaults per card type, skipping anything the user has no data for. */
function togglesForKind(kind: ShareKind, available: Availability): ShareToggles {
  const on = { ...DEFAULT_TOGGLES };
  for (const key of Object.keys(on) as (keyof ShareToggles)[]) {
    on[key] = KIND_TOGGLES[kind].includes(key) && DEFAULT_TOGGLES[key];
  }
  if (kind === "MONTHLY_RECAP") {
    on.amount = available.amount;
    on.method = available.method;
    on.achievement = true;
  }
  if (kind === "JOURNEY") on.startDate = true;
  if (kind === "CHALLENGE" || kind === "ACHIEVEMENT") on.streak = true;
  on.quote = available.quote && KIND_TOGGLES[kind].includes("quote");
  return on;
}

function unavailableReason(kind: ShareKind) {
  if (kind === "CHALLENGE") return "Start a challenge first.";
  if (kind === "ACHIEVEMENT") return "Unlock a badge first.";
  return "Log a day first.";
}

/** Native share sheet where supported, with sensible fallbacks. */
async function nativeShare(result: Extract<PublishResult, { ok: true }>) {
  const absolute = new URL(result.imageUrl, window.location.origin).toString();
  try {
    const response = await fetch(absolute);
    const blob = await response.blob();
    const file = new File([blob], "cayenne-do-it.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: result.captions.CASUAL });
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: "Cayenne Do It", url: result.url });
      return;
    }
    window.open(absolute, "_blank", "noopener");
  } catch {
    window.open(absolute, "_blank", "noopener");
  }
}

async function saveImage(result: Extract<PublishResult, { ok: true }>) {
  const absolute = new URL(result.imageUrl, window.location.origin).toString();
  try {
    const response = await fetch(absolute);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cayenne-do-it.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    window.open(absolute, "_blank", "noopener");
  }
}
