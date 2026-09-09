-- Platform Admin backend: roles, entitlement provenance, account state,
-- content management flags, an audit trail, feedback, and the daily rollup
-- table admin analytics read instead of scanning raw tables.

CREATE TYPE "Role" AS ENUM ('USER', 'PLATFORM_ADMIN');
CREATE TYPE "EntitlementSource" AS ENUM ('PAID', 'COMPLIMENTARY');
CREATE TYPE "AdminAction" AS ENUM (
  'GRANT_LIFETIME', 'REVOKE_LIFETIME', 'DISABLE_ACCOUNT', 'ENABLE_ACCOUNT',
  'FORCE_PASSWORD_RESET', 'ROLE_CHANGED', 'QUOTE_CREATED', 'QUOTE_UPDATED',
  'QUOTE_DISABLED', 'QUOTE_ENABLED', 'CHALLENGE_CREATED', 'CHALLENGE_UPDATED',
  'ACHIEVEMENT_UPDATED', 'FEEDBACK_UPDATED'
);
CREATE TYPE "FeedbackType" AS ENUM ('BUG', 'FEATURE', 'GENERAL');
CREATE TYPE "FeedbackStatus" AS ENUM ('NEW', 'REVIEWING', 'PLANNED', 'RESOLVED', 'CLOSED');

-- --------------------------------------------------------------------- user --
ALTER TABLE "User"
  ADD COLUMN "role"                "Role" NOT NULL DEFAULT 'USER',
  ADD COLUMN "entitlementSource"   "EntitlementSource",
  ADD COLUMN "entitlementProvider" VARCHAR(40),
  ADD COLUMN "entitlementNote"     VARCHAR(200),
  ADD COLUMN "disabledAt"          TIMESTAMP(3),
  ADD COLUMN "passwordResetAt"     TIMESTAMP(3),
  ADD COLUMN "lastSeenAt"          TIMESTAMP(3);

-- Accounts that already hold lifetime got it through the dev unlock or the
-- grant script, so they are complimentary until a payment provider says
-- otherwise. Guessing "paid" here would put fiction on the revenue page.
UPDATE "User"
SET "entitlementSource" = 'COMPLIMENTARY', "entitlementProvider" = 'manual'
WHERE "entitlement" = 'LIFETIME';

CREATE INDEX "User_createdAt_idx"   ON "User"("createdAt");
CREATE INDEX "User_entitlement_idx" ON "User"("entitlement");
CREATE INDEX "User_lastSeenAt_idx"  ON "User"("lastSeenAt");
CREATE INDEX "User_entitledAt_idx"  ON "User"("entitledAt");

-- ------------------------------------------------------------------ content --
ALTER TABLE "Quote"
  ADD COLUMN "isActive"      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "tone"          "ShareTone",
  ADD COLUMN "milestoneDays" INTEGER,
  ADD COLUMN "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Quote_isActive_category_idx" ON "Quote"("isActive", "category");

ALTER TABLE "Challenge" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "Challenge_isActive_sortOrder_idx" ON "Challenge"("isActive", "sortOrder");

-- ---------------------------------------------------------- report indexes --
CREATE INDEX "CayenneEntry_takenOn_idx"        ON "CayenneEntry"("takenOn");
CREATE INDEX "UserChallenge_createdAt_idx"     ON "UserChallenge"("createdAt");
CREATE INDEX "UserChallenge_completedAt_idx"   ON "UserChallenge"("completedAt");
CREATE INDEX "Recipe_isSystem_createdAt_idx"   ON "Recipe"("isSystem", "createdAt");
CREATE INDEX "Profile_totalDays_idx"           ON "Profile"("totalDays");
CREATE INDEX "Profile_currentStreak_idx"       ON "Profile"("currentStreak");
CREATE INDEX "Profile_lastLoggedOn_idx"        ON "Profile"("lastLoggedOn");

-- ---------------------------------------------------------------- audit log --
CREATE TABLE "AdminAuditLog" (
    "id"              TEXT NOT NULL,
    "adminId"         TEXT,
    "adminEmail"      TEXT NOT NULL,
    "action"          "AdminAction" NOT NULL,
    "targetUserId"    TEXT,
    "targetUserEmail" TEXT,
    "targetLabel"     VARCHAR(120),
    "beforeState"     VARCHAR(400),
    "afterState"      VARCHAR(400),
    "note"            VARCHAR(400),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminAuditLog_createdAt_idx"              ON "AdminAuditLog"("createdAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx"       ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX "AdminAuditLog_targetUserId_createdAt_idx" ON "AdminAuditLog"("targetUserId", "createdAt");

ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
    FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------- feedback --
CREATE TABLE "Feedback" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT,
    "type"      "FeedbackType" NOT NULL,
    "message"   VARCHAR(2000) NOT NULL,
    "status"    "FeedbackStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");
CREATE INDEX "Feedback_createdAt_idx"        ON "Feedback"("createdAt");
CREATE INDEX "Feedback_userId_idx"           ON "Feedback"("userId");

ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- -------------------------------------------------------------- daily stats --
CREATE TABLE "DailyStat" (
    "day"               DATE NOT NULL,
    "signups"           INTEGER NOT NULL DEFAULT 0,
    "activeUsers"       INTEGER NOT NULL DEFAULT 0,
    "entries"           INTEGER NOT NULL DEFAULT 0,
    "shareCards"        INTEGER NOT NULL DEFAULT 0,
    "shareImagesSaved"  INTEGER NOT NULL DEFAULT 0,
    "purchases"         INTEGER NOT NULL DEFAULT 0,
    "challengesStarted" INTEGER NOT NULL DEFAULT 0,
    "challengesDone"    INTEGER NOT NULL DEFAULT 0,
    "recipesCreated"    INTEGER NOT NULL DEFAULT 0,
    "computedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyStat_pkey" PRIMARY KEY ("day")
);
