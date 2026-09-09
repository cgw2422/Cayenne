-- Multiple daily doses.
--
-- A user may take cayenne several times a day and want a reminder for each, so
-- the single `NotificationPreference.reminderMinute` becomes a `ReminderTime`
-- row per dose. The table is created and backfilled BEFORE the old column is
-- dropped, so nobody loses the reminder they already set.

-- CreateTable
CREATE TABLE "ReminderTime" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "label" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ReminderTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReminderTime_userId_idx" ON "ReminderTime"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderTime_userId_minute_key" ON "ReminderTime"("userId", "minute");

-- AddForeignKey
ALTER TABLE "ReminderTime" ADD CONSTRAINT "ReminderTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "dosesPerDay" INTEGER NOT NULL DEFAULT 1;

-- Backfill: carry each existing reminder across as the user's first dose time.
INSERT INTO "ReminderTime" ("id", "userId", "minute", "label", "enabled")
SELECT
    gen_random_uuid()::text,
    "userId",
    "reminderMinute",
    'Dose 1',
    "dailyReminder"
FROM "NotificationPreference"
ON CONFLICT ("userId", "minute") DO NOTHING;

-- AlterTable
ALTER TABLE "NotificationPreference" DROP COLUMN "reminderMinute";
