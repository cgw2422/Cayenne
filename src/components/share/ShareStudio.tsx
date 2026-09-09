"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { LinePicker } from "@/components/share/LinePicker";
import { PhotoPicker } from "@/components/share/PhotoPicker";
import { Button, Card, cx } from "@/components/ui/primitives";
import { Toggle } from "@/components/Onboarding";
import { CAPTION_STYLES, CAPTION_STYLE_LABEL, type CaptionStyle } from "@/lib/share/captions";
import { DEFAULT_TONE, TONES, TONE_BLURB, TONE_LABEL, type Tone } from "@/lib/share/voice";

import {
  DEFAULT_TOGGLES,
  KIND_META,
  KIND_TOGGLES,
  PHOTO_KINDS,
  SHARE_KINDS,
  SIZES,
  STANDARD_THEME_IDS,
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

/**
 * The four steps. Each answers one question and nothing else, because a studio
 * that shows every control at once is a settings screen, not a studio.
 */
const STEPS = ["CHOOSE", "STYLE", "WORDING", "SHARE"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABEL: Record<Step, string> = {
  CHOOSE: "Choose",
  STYLE: "Style",
  WORDING: "Words",
  SHARE: "Share",
};

export function ShareStudio({
  initialKind,
  initialTheme,
  achievementId,
  todaysQuote,
  quotes,
  available,
  onPublish,
  onTrack,
  onLineOptions,
  onSaveLine,
  onForgetLine,
  onUploadPhoto,
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
  onLineOptions: (input: {
    kind: string;
    tone: string;
    achievementId?: string | null;
  }) => Promise<{ suggested: string[]; saved: string[] }>;
  onSaveLine: (text: string) => Promise<{ ok: boolean }>;
  onForgetLine: (text: string) => Promise<{ ok: boolean }>;
  onUploadPhoto: (input: {
    dataUrl: string;
    width: number;
    height: number;
  }) => Promise<{ ok: true; id: string } | { ok: false; message: string }>;
}) {
  const [step, setStep] = useState<Step>(initialKind ? "STYLE" : "CHOOSE");
  const [kind, setKind] = useState<ShareKind | null>(initialKind);
  const [theme, setTheme] = useState<ThemeId>(initialTheme);
  const [size, setSize] = useState<SizeId>("FACEBOOK");
  const [tone, setTone] = useState<Tone>(DEFAULT_TONE);
  const [toggles, setToggles] = useState<ShareToggles>(
    initialKind ? togglesForKind(initialKind, available) : DEFAULT_TOGGLES,
  );
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [customLine, setCustomLine] = useState<string | null>(null);
  const [lines, setLines] = useState<{ suggested: string[]; saved: string[] }>({
    suggested: [],
    saved: [],
  });
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

  // The published card is a snapshot. The moment any selection moves, the card
  // in `result` no longer matches the preview, so it stops being offered.
  const invalidate = useCallback(() => setResult(null), []);

  // Wording depends on the card type and the tone, and on the user's real
  // numbers — a line is only offered when it's true of them.
  const request = useRef(0);
  useEffect(() => {
    if (!kind) return;
    const ticket = ++request.current;
    void onLineOptions({ kind, tone, achievementId }).then((next) => {
      if (request.current === ticket) setLines(next);
    });
  }, [kind, tone, achievementId, onLineOptions]);

  const suggested = lines.suggested;
  const suggestedLine = suggested.length
    ? suggested[((lineIndex % suggested.length) + suggested.length) % suggested.length]
    : "";
  const currentLine = customLine ?? suggestedLine;

  // Three states, matching the stats builder exactly: today's quote (send
  // nothing), no quote, or a chosen one. Preview and publish must agree or the
  // exported card won't match what the user approved.
  const quoteParam =
    quoteMode === "none" ? "" : quoteMode === "custom" ? customQuote : null;
  const quoteForPublish =
    quoteMode === "today" ? undefined : quoteMode === "none" ? null : customQuote;

  /** The preview is the real renderer, so what you see is what exports. */
  const params = useCallback(
    (override: { theme?: ThemeId; scale: number }) => {
      const on = (Object.keys(toggles) as (keyof ShareToggles)[])
        .filter((k) => toggles[k])
        .join(",");
      const query = new URLSearchParams({
        kind: kind ?? "HOT_STREAK",
        theme: override.theme ?? theme,
        size,
        tone,
        on,
        scale: String(override.scale),
      });
      if (customLine) query.set("line", customLine);
      else query.set("li", String(lineIndex));
      if (photoId) query.set("photo", photoId);
      if (quoteParam !== null) query.set("quote", quoteParam);
      if (achievementId) query.set("achievement", achievementId);
      return `/api/share/preview?${query.toString()}`;
    },
    [
      kind,
      theme,
      size,
      tone,
      toggles,
      lineIndex,
      customLine,
      photoId,
      quoteParam,
      achievementId,
    ],
  );

  const previewSrc = useMemo(
    () => (kind ? params({ scale: 0.5 }) : null),
    [kind, params],
  );

  const aspect = `${SIZES[size].width} / ${SIZES[size].height}`;

  // ---------------------------------------------------------------- steps --
  const canAdvance = kind !== null;
  const index = STEPS.indexOf(step);

  function go(next: Step) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!kind || step === "CHOOSE") {
    return (
      <div className="flex flex-col gap-4 px-5 pb-8 pt-1">
        <StepBar step="CHOOSE" kind={kind} onGo={go} />
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
                    setLineIndex(0);
                    setCustomLine(null);
                    setPhotoId(null);
                    if (!(PHOTO_KINDS as readonly string[]).includes(k)) {
                      setTheme((prev) => (prev === "PHOTO" ? "SIGNATURE" : prev));
                    }
                    setResult(null);
                    void onTrack({ event: "TYPE_SELECTED", kind: k });
                    go("STYLE");
                  }}
                  className={cx(
                    "tap flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-all active:scale-[0.99]",
                    disabled
                      ? "border-cream-300 bg-cream-100/60 opacity-55"
                      : kind === k
                        ? "border-cayenne-600 bg-cayenne-50"
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
                  <span aria-hidden="true" className="shrink-0 text-charcoal-500">
                    ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const relevant = KIND_TOGGLES[kind];
  const photoAllowed = (PHOTO_KINDS as readonly string[]).includes(kind);
  // The photo template is a real template, not a filter: it only appears once
  // the user has given it something to be built around.
  const templates: ThemeId[] = photoAllowed && photoId
    ? [...STANDARD_THEME_IDS, "PHOTO"]
    : STANDARD_THEME_IDS;

  return (
    <div className="flex flex-col gap-4 px-5 pb-8 pt-1">
      <StepBar step={step} kind={kind} onGo={go} />

      {/* --------------------------------------------------------- preview -- */}
      <div
        className={cx(
          step === "SHARE"
            ? "overflow-hidden rounded-[1.5rem] bg-cream-200/60 shadow-lift"
            : "sticky top-0 z-20 -mx-5 border-b border-cream-200 bg-cream-100/90 px-5 pb-2.5 pt-1 backdrop-blur-lg",
        )}
      >
        <div
          className={cx(
            step === "SHARE"
              ? ""
              : "mx-auto overflow-hidden rounded-2xl bg-cream-200/60 shadow-soft",
          )}
          style={step === "SHARE" ? undefined : { maxHeight: "34vh", aspectRatio: aspect }}
        >
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={previewSrc}
              src={previewSrc}
              alt={`${KIND_META[kind].label} card preview`}
              className={step === "SHARE" ? "w-full" : "h-full w-full object-contain"}
              style={step === "SHARE" ? { aspectRatio: aspect } : undefined}
            />
          ) : null}
        </div>
        {step !== "SHARE" ? (
          <p className="mt-1.5 text-center text-[11px] font-bold text-charcoal-500">
            Live preview — this is exactly what exports.
          </p>
        ) : null}
      </div>

      {/* ----------------------------------------------------------- style -- */}
      {step === "STYLE" ? (
        <>
          <section>
            <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
              Template
            </p>
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
              {templates.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={theme === t}
                  onClick={() => {
                    setTheme(t);
                    invalidate();
                    void onTrack({ event: "TEMPLATE_SELECTED", kind, theme: t, size });
                  }}
                  className={cx(
                    "shrink-0 overflow-hidden rounded-2xl border-2 transition-all",
                    theme === t ? "border-cayenne-600" : "border-cream-300",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={params({ theme: t, scale: 0.14 })}
                    alt=""
                    className="block w-[84px]"
                    style={{ aspectRatio: aspect }}
                  />
                  <span
                    className={cx(
                      "block px-2 py-1.5 text-[10px] font-extrabold",
                      theme === t
                        ? "bg-cayenne-50 text-cayenne-700"
                        : "bg-white text-charcoal-500",
                    )}
                  >
                    {THEME_LABEL[t]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {photoAllowed ? (
            <PhotoPicker
              hasPhoto={photoId !== null}
              onUpload={onUploadPhoto}
              onPicked={(id) => {
                setPhotoId(id);
                setTheme("PHOTO");
                invalidate();
              }}
              onCleared={() => {
                setPhotoId(null);
                setTheme((prev) => (prev === "PHOTO" ? "SIGNATURE" : prev));
                invalidate();
              }}
            />
          ) : null}

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
                    invalidate();
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
            <p className="mt-2 text-xs text-charcoal-500">
              {size === "FACEBOOK"
                ? "Tall enough to fill a phone feed without being cropped."
                : SIZES[size].label}
            </p>
          </section>
        </>
      ) : null}

      {/* --------------------------------------------------------- wording -- */}
      {step === "WORDING" ? (
        <>
          <LinePicker
            current={currentLine}
            suggested={suggested}
            saved={lines.saved}
            custom={customLine}
            onPick={(i) => {
              setLineIndex(i);
              setCustomLine(null);
              invalidate();
              void onTrack({ event: "WORDING_CHANGED", kind, theme, size });
            }}
            onWrite={(text) => {
              setCustomLine(text);
              invalidate();
              void onTrack({ event: "WORDING_CHANGED", kind, theme, size });
            }}
            onSaveLine={async (text) => {
              const r = await onSaveLine(text);
              setLines((prev) => ({
                ...prev,
                saved: [text, ...prev.saved.filter((l) => l !== text)].slice(0, 12),
              }));
              return r;
            }}
            onForgetLine={async (text) => {
              const r = await onForgetLine(text);
              setLines((prev) => ({ ...prev, saved: prev.saved.filter((l) => l !== text) }));
              return r;
            }}
          />

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
                    // A new tone is a request for a different voice, so the
                    // suggestions take over again. Anything written by hand is
                    // saved and one tap away under "Write my own".
                    setLineIndex(0);
                    setCustomLine(null);
                    invalidate();
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
                          invalidate();
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
                      invalidate();
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
                <p className="text-sm italic text-charcoal-500">
                  &ldquo;{todaysQuote}&rdquo;
                </p>
              ) : null}

              {quoteMode === "custom" ? (
                <select
                  value={customQuote}
                  onChange={(e) => {
                    setCustomQuote(e.target.value);
                    invalidate();
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
        </>
      ) : null}

      {/* ----------------------------------------------------------- share -- */}
      {step === "SHARE" ? (
        <>
          <div className="grid gap-2.5">
            <Button
              size="lg"
              full
              disabled={busy}
              className="!bg-[#1877F2] !bg-none text-white shadow-lift"
              onClick={() => shareToFacebook()}
            >
              <FacebookGlyph />
              {busy ? "Making your card…" : "Share to Facebook"}
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="secondary"
                size="lg"
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
                More apps
              </Button>
              <Button
                variant="secondary"
                size="lg"
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
          </div>

          <Card className="grid gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
                Caption
              </p>
              <p className="mt-1 text-xs text-charcoal-500">
                Copied for you when you share to Facebook — just paste it.
              </p>
            </div>
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
            {result?.ok ? (
              <>
                <p className="rounded-2xl bg-cream-100 px-4 py-3 text-[15px] leading-relaxed text-charcoal-900">
                  {result.captions[captionStyle]}
                </p>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    const ok = await copyText(result.captions[captionStyle]);
                    if (!ok) return;
                    setCopied("caption");
                    setTimeout(() => setCopied(null), 2200);
                    void onTrack({
                      event: "CAPTION_COPIED",
                      kind,
                      theme,
                      size,
                      captionStyle,
                    });
                  }}
                >
                  {copied === "caption" ? "Caption copied ✓" : "Copy caption"}
                </Button>
                <p className="break-all border-t border-cream-200 pt-3 text-center text-xs text-charcoal-500">
                  {result.url}
                </p>
              </>
            ) : (
              <p className="rounded-2xl bg-cream-100 px-4 py-3 text-[15px] leading-relaxed text-charcoal-500">
                Your caption appears here the moment you share or save.
              </p>
            )}
          </Card>

          {result && !result.ok ? (
            <p className="text-center text-sm font-bold text-cayenne-700">
              {result.message}
            </p>
          ) : null}
        </>
      ) : null}

      {/* ------------------------------------------------------ navigation -- */}
      <div className="mt-1 flex gap-2.5">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => go(STEPS[Math.max(0, index - 1)])}
          className="shrink-0"
        >
          Back
        </Button>
        {step === "SHARE" ? null : (
          <Button
            size="lg"
            full
            disabled={!canAdvance}
            onClick={() => go(STEPS[index + 1])}
          >
            {step === "STYLE" ? "Next: wording" : "Next: share"}
          </Button>
        )}
      </div>
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
      lineIndex,
      customLine,
      photoId,
      achievementId,
    });
    setResult(r);
    return r;
  }

  /**
   * Facebook, the way it actually works on each device.
   *
   * On a phone the share sheet hands the image file straight to the Facebook
   * app, which is the post people want. On a desktop there's no file hand-off,
   * so we open Facebook's sharer against the card's public page — its Open
   * Graph tags pull the same image in — and put the caption on the clipboard so
   * it's a single paste.
   */
  function shareToFacebook() {
    // The popup has to be claimed inside the click, before any await, or the
    // browser treats it as unsolicited and blocks it.
    const canFile =
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const tab = canFile ? null : window.open("about:blank", "_blank", "noopener");

    startTransition(async () => {
      const r = await publish();
      if (!r?.ok) {
        tab?.close();
        return;
      }
      void onTrack({ event: "FACEBOOK_SHARE_CLICKED", kind, theme, size });
      await copyText(r.captions[captionStyle]);

      if (canFile) {
        await nativeShare(r);
        return;
      }
      const sharer = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        r.url,
      )}`;
      if (tab) tab.location.href = sharer;
      else window.open(sharer, "_blank", "noopener");
    });
  }
}

/** Where you are, and a way back to anything you've already decided. */
function StepBar({
  step,
  kind,
  onGo,
}: {
  step: Step;
  kind: ShareKind | null;
  onGo: (step: Step) => void;
}) {
  const index = STEPS.indexOf(step);
  return (
    <nav aria-label="Share steps" className="flex items-center gap-1.5">
      {STEPS.map((s, i) => {
        const done = i < index;
        const here = i === index;
        return (
          <button
            key={s}
            type="button"
            aria-current={here ? "step" : undefined}
            disabled={i > index || (i > 0 && !kind)}
            onClick={() => onGo(s)}
            className={cx(
              "flex-1 rounded-full py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] transition-all",
              here
                ? "bg-cayenne-600 text-white"
                : done
                  ? "bg-cayenne-50 text-cayenne-700"
                  : "bg-cream-200 text-charcoal-500 opacity-70",
            )}
          >
            {i === 0 && kind ? `${KIND_META[kind].icon} ` : ""}
            {STEP_LABEL[s]}
          </button>
        );
      })}
    </nav>
  );
}

function FacebookGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard blocked — the caption is selectable on screen either way.
    return false;
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
