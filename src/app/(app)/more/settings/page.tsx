import { SubHeader } from "../_SubHeader";
import { SettingsForm } from "@/components/SettingsForm";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { updateSettings } from "./actions";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [prefs, reminders] = await Promise.all([
    prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
    prisma.reminderTime.findMany({
      where: { userId: user.id },
      orderBy: { minute: "asc" },
      select: { minute: true, enabled: true },
    }),
  ]);

  return (
    <>
      <SubHeader title="Settings" />
      <SettingsForm
        initial={{
          displayName: user.displayName,
          email: user.email,
          defaultMethod: user.profile?.defaultMethod ?? null,
          defaultAmount: user.profile?.defaultAmount
            ? Number(user.profile.defaultAmount)
            : null,
          defaultUnit: user.profile?.defaultUnit ?? "TSP",
          unitSystem: user.profile?.unitSystem ?? "IMPERIAL",
          timezone: user.profile?.timezone ?? "UTC",
          dailyReminder: prefs?.dailyReminder ?? false,
          doses: reminders.length ? reminders : [{ minute: 480, enabled: true }],
          streakWarning: prefs?.streakWarning ?? true,
          milestoneAlert: prefs?.milestoneAlert ?? true,
        }}
        onSave={updateSettings}
      />
    </>
  );
}
