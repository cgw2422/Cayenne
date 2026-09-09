"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/server/auth";
import { fieldErrors, signInSchema, signUpSchema, type ActionState } from "@/lib/validation";
import { dateColumnFromDayKey, todayInZone } from "@/lib/date";

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    timezone: formData.get("timezone") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const { displayName, email, password } = parsed.data;
  const timezone = parsed.data.timezone || "UTC";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      errors: { email: "That email already has an account. Try signing in." },
    };
  }

  const today = todayInZone(timezone);

  const user = await prisma.user.create({
    data: {
      email,
      displayName,
      passwordHash: await hashPassword(password),
      profile: {
        create: {
          startedOn: dateColumnFromDayKey(today),
          timezone,
          avatarHue: Math.floor(Math.random() * 360),
        },
      },
      notifications: { create: {} },
    },
  });

  const ua = (await headers()).get("user-agent");
  await createSession(user.id, ua);
  redirect("/welcome");
}

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Same message either way — never reveal whether an address is registered.
  const invalid: ActionState = {
    ok: false,
    errors: { form: "That email and password don't match." },
  };

  if (!user?.passwordHash) return invalid;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return invalid;

  // A disabled account is told plainly, and only after the password checks out
  // — the generic message above still covers whether the address exists.
  if (user.disabledAt) {
    return {
      ok: false,
      errors: { form: "This account has been disabled. Get in touch if that's wrong." },
    };
  }

  const ua = (await headers()).get("user-agent");
  await createSession(user.id, ua);
  redirect(user.onboardedAt ? "/home" : "/welcome");
}

export async function signOut() {
  await destroySession();
  redirect("/");
}
