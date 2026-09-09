import { redirect } from "next/navigation";

import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { getSessionUser } from "@/server/auth";
import { changePassword } from "./actions";

export const metadata = { title: "Choose a new password" };
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-5 px-5 py-10">
      <div>
        <h1 className="text-2xl font-extrabold text-charcoal-900">
          {user.passwordResetAt ? "Set a new password" : "Change your password"}
        </h1>
        {user.passwordResetAt ? (
          <p className="mt-2 text-[15px] leading-relaxed text-charcoal-500">
            Your password needs changing before you carry on. Nothing you&apos;ve
            logged has been touched.
          </p>
        ) : null}
      </div>
      <ChangePasswordForm onSubmit={changePassword} />
    </main>
  );
}
