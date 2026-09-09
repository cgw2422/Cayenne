"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/admin/shell";
import { cx } from "@/components/ui/primitives";
import type { AdminResult } from "@/app/admin/content/actions";

const QUOTE_CATEGORIES = [
  "DAILY",
  "STREAK",
  "COMEBACK",
  "MILESTONE",
  "FUNNY",
  "ENCOURAGEMENT",
] as const;

const TONES = ["CLEAN", "FUNNY", "MOTIVATIONAL", "PROUD"] as const;

export type QuoteRow = {
  id: string;
  text: string;
  category: string;
  tone: string | null;
  milestoneDays: number | null;
  isActive: boolean;
  impressions: number;
};

export type ChallengeRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  durationDays: number;
  isPremium: boolean;
  isActive: boolean;
  participants: number;
};

export type AchievementRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: string;
  threshold: number;
  unlocks: number;
};

/** A small banner that reports what the last save did. */
function useResult() {
  const [result, setResult] = useState<AdminResult | null>(null);
  const banner = result ? (
    <p
      role="status"
      className={cx(
        "text-xs font-medium",
        result.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
      )}
    >
      {result.message}
    </p>
  ) : null;
  return { setResult, banner };
}

// ------------------------------------------------------------------ quotes --

export function QuotesManager({
  quotes,
  onSave,
  onSetActive,
}: {
  quotes: QuoteRow[];
  onSave: (input: {
    id?: string;
    text: string;
    category: string;
    tone?: string;
    milestoneDays?: string;
  }) => Promise<AdminResult>;
  onSetActive: (input: { id: string; active: boolean }) => Promise<AdminResult>;
}) {
  const [editing, setEditing] = useState<QuoteRow | "new" | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const { setResult, banner } = useResult();
  const [busy, startTransition] = useTransition();

  const visible = quotes.filter((q) => {
    if (filter === "all") return true;
    if (filter === "inactive") return !q.isActive;
    return q.category === filter;
  });

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Add quote
        </button>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter quotes"
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="all">All ({quotes.length})</option>
          <option value="inactive">Retired</option>
          {QUOTE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {banner}
      </div>

      {editing ? (
        <QuoteForm
          quote={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={(values) =>
            startTransition(async () => {
              const result = await onSave(values);
              setResult(result);
              if (result.ok) setEditing(null);
            })
          }
          busy={busy}
        />
      ) : null}

      <ul className="grid gap-1.5">
        {visible.map((quote) => (
          <li
            key={quote.id}
            className={cx(
              "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm",
              quote.isActive
                ? "border-slate-200 dark:border-slate-800"
                : "border-dashed border-slate-300 opacity-60 dark:border-slate-700",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block">{quote.text}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <Badge>{quote.category}</Badge>
                {quote.tone ? <Badge tone="info">{quote.tone}</Badge> : null}
                {quote.milestoneDays ? (
                  <Badge tone="warn">{quote.milestoneDays}d</Badge>
                ) : null}
                <span>shown {quote.impressions.toLocaleString()}×</span>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setEditing(quote)}
              className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
            >
              Edit
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                startTransition(async () =>
                  setResult(await onSetActive({ id: quote.id, active: !quote.isActive })),
                )
              }
              className="text-xs font-medium text-slate-500 hover:underline"
            >
              {quote.isActive ? "Retire" : "Restore"}
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Nothing in that filter.</p>
      ) : null}
    </div>
  );
}

function QuoteForm({
  quote,
  onSave,
  onCancel,
  busy,
}: {
  quote: QuoteRow | null;
  onSave: (values: {
    id?: string;
    text: string;
    category: string;
    tone?: string;
    milestoneDays?: string;
  }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [text, setText] = useState(quote?.text ?? "");
  const [category, setCategory] = useState(quote?.category ?? "DAILY");
  const [tone, setTone] = useState(quote?.tone ?? "");
  const [milestone, setMilestone] = useState(
    quote?.milestoneDays ? String(quote.milestoneDays) : "",
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ id: quote?.id, text, category, tone, milestoneDays: milestone });
      }}
      className="grid gap-3 rounded-md border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
    >
      <label className="grid gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Quote
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={240}
          required
          className="w-full resize-none rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <span className="text-xs text-slate-500">
          {text.length}/240 — the app makes no health claims, so neither should this.
        </span>
      </label>

      <div className="flex flex-wrap gap-3">
        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {QUOTE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Personality
          </span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Any</option>
            {TONES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Milestone (days)
          </span>
          <input
            type="number"
            min={0}
            max={3650}
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            placeholder="Any"
            className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {busy ? "Saving…" : quote ? "Save quote" : "Add quote"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// -------------------------------------------------------------- challenges --

export function ChallengesManager({
  challenges,
  onSave,
}: {
  challenges: ChallengeRow[];
  onSave: (input: {
    id?: string;
    title: string;
    description: string;
    durationDays: string;
    isPremium: boolean;
    isActive: boolean;
  }) => Promise<AdminResult>;
}) {
  const [editing, setEditing] = useState<ChallengeRow | "new" | null>(null);
  const { setResult, banner } = useResult();
  const [busy, startTransition] = useTransition();

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
        >
          Add challenge
        </button>
        {banner}
      </div>

      {editing ? (
        <ChallengeForm
          challenge={editing === "new" ? null : editing}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={(values) =>
            startTransition(async () => {
              const result = await onSave(values);
              setResult(result);
              if (result.ok) setEditing(null);
            })
          }
        />
      ) : null}

      <ul className="grid gap-1.5">
        {challenges.map((challenge) => (
          <li
            key={challenge.id}
            className={cx(
              "flex flex-wrap items-start gap-2 rounded-md border px-3 py-2 text-sm",
              challenge.isActive
                ? "border-slate-200 dark:border-slate-800"
                : "border-dashed border-slate-300 opacity-60 dark:border-slate-700",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="font-medium">{challenge.title}</span>
              <span className="block text-xs text-slate-500">{challenge.description}</span>
              <span className="mt-1 flex flex-wrap gap-1.5">
                <Badge>{challenge.durationDays} days</Badge>
                {challenge.isPremium ? <Badge tone="warn">Premium</Badge> : null}
                {!challenge.isActive ? <Badge tone="bad">Retired</Badge> : null}
                <Badge tone="info">{challenge.participants} joined</Badge>
              </span>
            </span>
            <button
              type="button"
              onClick={() => setEditing(challenge)}
              className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChallengeForm({
  challenge,
  onSave,
  onCancel,
  busy,
}: {
  challenge: ChallengeRow | null;
  onSave: (values: {
    id?: string;
    title: string;
    description: string;
    durationDays: string;
    isPremium: boolean;
    isActive: boolean;
  }) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState(challenge?.title ?? "");
  const [description, setDescription] = useState(challenge?.description ?? "");
  const [days, setDays] = useState(String(challenge?.durationDays ?? 30));
  const [premium, setPremium] = useState(challenge?.isPremium ?? false);
  const [active, setActive] = useState(challenge?.isActive ?? true);

  const durationChanged =
    challenge !== null && Number(days) !== challenge.durationDays && challenge.participants > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          id: challenge?.id,
          title,
          description,
          durationDays: days,
          isPremium: premium,
          isActive: active,
        });
      }}
      className="grid gap-3 rounded-md border border-slate-300 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950"
    >
      <label className="grid gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Name
        </span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={80}
          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <label className="grid gap-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
          maxLength={400}
          className="resize-none rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </label>

      <div className="flex flex-wrap items-end gap-4">
        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Duration (days)
          </span>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            required
            className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={premium}
            onChange={(e) => setPremium(e.target.checked)}
          />
          Premium only
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Active
        </label>
      </div>

      {durationChanged ? (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
          {challenge?.participants} people are part-way through this. Changing the
          duration moves their finish line — it will be recorded in the audit log.
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {busy ? "Saving…" : challenge ? "Save challenge" : "Add challenge"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------ achievements --

export function AchievementsManager({
  achievements,
  onSave,
}: {
  achievements: AchievementRow[];
  onSave: (input: {
    id: string;
    title: string;
    description: string;
  }) => Promise<AdminResult>;
}) {
  const [editing, setEditing] = useState<AchievementRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { setResult, banner } = useResult();
  const [busy, startTransition] = useTransition();

  return (
    <div className="grid gap-3">
      <p className="text-xs text-slate-500">
        Wording only. What unlocks a badge — its kind and threshold — is what the
        unlock logic runs on, so it is not editable from a web form.
      </p>
      {banner}

      <ul className="grid gap-1.5">
        {achievements.map((achievement) => (
          <li
            key={achievement.id}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
          >
            {editing?.id === achievement.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  startTransition(async () => {
                    const result = await onSave({ id: achievement.id, title, description });
                    setResult(result);
                    if (result.ok) setEditing(null);
                  });
                }}
                className="grid gap-2"
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={60}
                  required
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={200}
                  required
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-md px-3 py-1 text-xs text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-start gap-2">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{achievement.title}</span>
                  <span className="block text-xs text-slate-500">
                    {achievement.description}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    <Badge>{achievement.kind}</Badge>
                    <Badge>threshold {achievement.threshold}</Badge>
                    <Badge tone="info">{achievement.unlocks} unlocked</Badge>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(achievement);
                    setTitle(achievement.title);
                    setDescription(achievement.description);
                  }}
                  className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                >
                  Edit wording
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
