import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { getSessionUser } from "@/server/auth";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage() {
  if (await getSessionUser()) redirect("/home");

  return (
    <>
      <h1 className="text-3xl font-extrabold text-charcoal-900">
        Let&apos;s get you started
      </h1>
      <p className="mb-7 mt-2 text-[15px] leading-relaxed text-charcoal-500">
        Build your cayenne habit, track your journey, and see your progress over time.
      </p>
      <AuthForm mode="sign-up" action={signUp} />
      <p className="mt-8 text-center text-xs leading-relaxed text-charcoal-500">
        Cayenne Do It is a habit and journaling app. It doesn&apos;t provide medical
        advice, diagnosis or treatment.
      </p>
    </>
  );
}
