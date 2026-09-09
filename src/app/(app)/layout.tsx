import { redirect } from "next/navigation";

import { AppFrame } from "@/components/AppShell";
import { getSessionUser } from "@/server/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (!user.onboardedAt) redirect("/welcome");

  return <AppFrame>{children}</AppFrame>;
}
