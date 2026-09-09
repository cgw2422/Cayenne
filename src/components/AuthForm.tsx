"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { Button, FieldError } from "@/components/ui/primitives";
import type { ActionState } from "@/lib/validation";

const INITIAL: ActionState = { ok: false };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" full disabled={pending}>
      {pending ? "One moment…" : label}
    </Button>
  );
}

export function AuthForm({
  mode,
  action,
}: {
  mode: "sign-in" | "sign-up";
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction] = useActionState(action, INITIAL);
  const tzRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tzRef.current) {
      tzRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
  }, []);

  const signUp = mode === "sign-up";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input ref={tzRef} type="hidden" name="timezone" defaultValue="UTC" />

      {state.errors?.form ? (
        <div
          role="alert"
          className="rounded-2xl border border-cayenne-200 bg-cayenne-50 px-4 py-3 text-sm font-semibold text-cayenne-800"
        >
          {state.errors.form}
        </div>
      ) : null}

      {signUp ? (
        <Field
          label="What should we call you?"
          name="displayName"
          type="text"
          autoComplete="given-name"
          placeholder="Alex"
          error={state.errors?.displayName}
        />
      ) : null}

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        error={state.errors?.email}
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={signUp ? "new-password" : "current-password"}
        placeholder={signUp ? "At least 10 characters" : "Your password"}
        error={state.errors?.password}
        hint={signUp ? "At least 10 characters. Longer is better than complicated." : undefined}
      />

      <Submit label={signUp ? "Create my account" : "Sign in"} />

      <p className="text-center text-sm text-charcoal-500">
        {signUp ? "Already have an account? " : "New here? "}
        <Link
          href={signUp ? "/sign-in" : "/sign-up"}
          className="font-bold text-cayenne-600 underline underline-offset-2"
        >
          {signUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
}) {
  const id = `field-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-extrabold text-charcoal-700"
      >
        {label}
      </label>
      <input
        {...rest}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="h-13 w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-base text-charcoal-900 shadow-soft outline-none transition placeholder:text-charcoal-500/60 focus:border-ember-400"
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-charcoal-500">
          {hint}
        </p>
      ) : null}
      <div id={`${id}-error`}>
        <FieldError message={error} />
      </div>
    </div>
  );
}
