"use client";

import { ConfirmAction } from "@/components/admin/ConfirmAction";
import type { AdminResult } from "@/app/admin/users/actions";

/**
 * The account actions on a user's detail page.
 *
 * Each one goes through a confirmation dialog, and each server action re-checks
 * admin authorization for itself — this component only decides what to offer,
 * never what is allowed.
 */
export function UserActions({
  userId,
  isLifetime,
  isDisabled,
  isSelf,
  onGrant,
  onRevoke,
  onSetDisabled,
  onForceReset,
}: {
  userId: string;
  isLifetime: boolean;
  isDisabled: boolean;
  isSelf: boolean;
  onGrant: (input: {
    userId: string;
    source: "PAID" | "COMPLIMENTARY";
    note?: string;
  }) => Promise<AdminResult>;
  onRevoke: (input: { userId: string; note?: string }) => Promise<AdminResult>;
  onSetDisabled: (input: {
    userId: string;
    disabled: boolean;
    note?: string;
  }) => Promise<AdminResult>;
  onForceReset: (input: { userId: string; note?: string }) => Promise<AdminResult>;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <ConfirmAction
        label={isLifetime ? "Change lifetime" : "Grant lifetime"}
        title={isLifetime ? "Change this lifetime grant" : "Grant lifetime access"}
        body="This unlocks every paid feature immediately — on their next page load, with no sign-out needed. Mark it complimentary unless money actually changed hands."
        confirmLabel="Grant lifetime"
        tone="good"
        fields={[
          {
            kind: "choice",
            name: "source",
            label: "Kind",
            options: [
              ["COMPLIMENTARY", "Complimentary — comped by you"],
              ["PAID", "Paid — money changed hands"],
            ],
          },
          {
            kind: "note",
            label: "Reason",
            placeholder: "Beta tester, Facebook group admin, launch giveaway…",
          },
        ]}
        onConfirm={(values) =>
          onGrant({
            userId,
            source: values.source === "PAID" ? "PAID" : "COMPLIMENTARY",
            note: values.note,
          })
        }
      />

      {isLifetime ? (
        <ConfirmAction
          label="Remove lifetime"
          title="Remove lifetime access"
          body="They drop back to the free tier at once. Their logs, streak and history are untouched — only what they can see changes."
          confirmLabel="Remove lifetime"
          tone="danger"
          fields={[{ kind: "note", label: "Reason", placeholder: "Refunded, chargeback…" }]}
          onConfirm={(values) => onRevoke({ userId, note: values.note })}
        />
      ) : null}

      {isDisabled ? (
        <ConfirmAction
          label="Re-enable account"
          title="Re-enable this account"
          body="They will be able to sign in again. They'll need to log in fresh — disabling ended their sessions."
          confirmLabel="Re-enable"
          tone="good"
          fields={[{ kind: "note", label: "Reason" }]}
          onConfirm={(values) =>
            onSetDisabled({ userId, disabled: false, note: values.note })
          }
        />
      ) : (
        <ConfirmAction
          label="Disable account"
          title="Disable this account"
          body="They are signed out everywhere immediately and cannot sign back in. Nothing is deleted, and it is reversible."
          confirmLabel="Disable account"
          tone="danger"
          fields={[{ kind: "note", label: "Reason", required: true }]}
          onConfirm={(values) =>
            onSetDisabled({ userId, disabled: true, note: values.note })
          }
        />
      )}

      <ConfirmAction
        label="Force password reset"
        title="Force a password reset"
        body="Ends every session and requires them to choose a new password the next time they sign in. There is no email provider wired up, so they will need their current password to get that far."
        confirmLabel="Force reset"
        tone="danger"
        fields={[{ kind: "note", label: "Reason", required: true }]}
        onConfirm={(values) => onForceReset({ userId, note: values.note })}
      />

      {isSelf ? (
        <p className="w-full text-xs text-slate-500">
          This is your own account. Disabling it is blocked server-side.
        </p>
      ) : null}
    </div>
  );
}
