"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/primitives";

/**
 * The wording control.
 *
 * Tapping the line cycles to the next one that fits the user's actual numbers —
 * the fastest possible way to get a phrase you'd be happy to post. Writing your
 * own is one tap further, and anything written is kept for reuse.
 */
export function LinePicker({
  current,
  suggested,
  saved,
  custom,
  onPick,
  onWrite,
  onSaveLine,
  onForgetLine,
}: {
  current: string;
  suggested: string[];
  saved: string[];
  custom: string | null;
  onPick: (index: number) => void;
  onWrite: (text: string | null) => void;
  onSaveLine: (text: string) => Promise<{ ok: boolean }>;
  onForgetLine: (text: string) => Promise<{ ok: boolean }>;
}) {
  const [index, setIndex] = useState(0);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState(custom ?? "");
  const [, startTransition] = useTransition();

  // A fresh pool (new card type or new tone) starts from its strongest line.
  const pool = suggested.join("|");
  useEffect(() => {
    setIndex(0);
  }, [pool]);

  // Not a filter, a nudge: the card is public, and health claims don't belong
  // on it. The user's own words are still their own.
  const claimish = /\b(cure[sd]?|treats?|heals?|prevents?|diagnos|remed(y|ies))/i.test(
    draft,
  );

  if (writing) {
    return (
      <div className="card grid gap-3 p-4">
        <label htmlFor="own-line" className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
          Write my own
        </label>
        <textarea
          id="own-line"
          rows={2}
          maxLength={120}
          value={draft}
          autoFocus
          placeholder="Say it how you'd actually say it."
          onChange={(e) => setDraft(e.target.value)}
          className="w-full resize-none rounded-2xl border border-cream-300 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-ember-400"
        />
        <div className="flex items-center justify-between text-xs text-charcoal-500">
          <span>{draft.length}/120</span>
          {claimish ? (
            <span className="font-bold text-cayenne-700">
              Keep health claims off shared cards.
            </span>
          ) : null}
        </div>

        {saved.length ? (
          <div className="grid gap-1.5 border-t border-cream-200 pt-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
              Lines you&apos;ve used
            </p>
            <ul className="grid gap-1.5">
              {saved.map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(line)}
                    className="min-w-0 flex-1 truncate rounded-xl bg-cream-100 px-3 py-2 text-left text-sm text-charcoal-900"
                  >
                    {line}
                  </button>
                  <button
                    type="button"
                    aria-label={`Forget "${line}"`}
                    onClick={() => startTransition(() => void onForgetLine(line))}
                    className="tap grid shrink-0 place-items-center rounded-xl text-charcoal-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            full
            disabled={draft.trim().length < 2}
            onClick={() => {
              const text = draft.replace(/\s+/g, " ").trim().slice(0, 120);
              onWrite(text);
              setWriting(false);
              startTransition(() => void onSaveLine(text));
            }}
          >
            Use this
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setWriting(false);
              setDraft(custom ?? "");
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      <button
        type="button"
        onClick={() => {
          if (custom) {
            onWrite(null);
            onPick(0);
            setIndex(0);
            return;
          }
          const next = index + 1;
          setIndex(next);
          onPick(next);
        }}
        className="card w-full p-4 text-left transition-all active:scale-[0.99]"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-charcoal-500">
            The line on your card
          </span>
          <span className="shrink-0 text-[11px] font-extrabold text-cayenne-600">
            {custom ? "Yours ✎" : `Tap for another · ${suggested.length}`}
          </span>
        </span>
        <span className="mt-2 block text-[17px] font-extrabold leading-snug text-charcoal-900">
          &ldquo;{current}&rdquo;
        </span>
      </button>

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            const next = index + 1;
            setIndex(next);
            onPick(next);
          }}
        >
          Next phrase
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            setDraft(custom ?? current);
            setWriting(true);
          }}
        >
          Write my own
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-charcoal-500">
        Lines are matched to your actual numbers — you&apos;ll never be told you had a
        perfect month when you didn&apos;t.
      </p>
    </div>
  );
}
