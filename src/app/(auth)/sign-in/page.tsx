import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { getSessionUser } from "@/server/auth";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const user = await getSessionUser();
  if (user) redirect(user.onboardedAt ? "/home" : "/welcome");

  return (
    <>
      <h1 className="text-3xl font-extrabold text-charcoal-900">Welcome back</h1>
      <p className="mb-7 mt-2 text-[15px] text-charcoal-500">
        Your streak has been waiting.
      </p>
      <AuthForm mode="sign-in" action={signIn} />
    </>
  );
}
