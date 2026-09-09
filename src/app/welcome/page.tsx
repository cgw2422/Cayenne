import { redirect } from "next/navigation";

import { Onboarding } from "@/components/Onboarding";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/server/auth";
import { completeOnboarding } from "./actions";

export const metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (user.onboardedAt) redirect("/home");

  const goals = await prisma.goal.findMany({
    where: { isSystem: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, label: true, icon: true },
  });

  return (
    <div className="mx-auto w-full max-w-lg">
      <Onboarding
        goals={goals}
        displayName={user.displayName}
        onComplete={completeOnboarding}
      />
    </div>
  );
}
