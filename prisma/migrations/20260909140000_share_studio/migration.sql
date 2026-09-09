-- Share Studio.
--
-- The old ShareCard held one generic card shape. Cards now come in seven kinds
-- across six themes and four export sizes, and store a snapshot of the numbers
-- so a published card re-renders identically for as long as its link lives.
--
-- Existing cards are dropped rather than migrated. They were produced by a
-- renderer that no longer exists, and re-rendering them under the new system
-- would silently change what someone already posted. Letting the old links 404
-- is the honest outcome.


-- CreateEnum
CREATE TYPE "ShareKind" AS ENUM ('HOT_STREAK', 'JOURNEY', 'ACHIEVEMENT', 'CHALLENGE', 'PROGRESS', 'PEP_TALK', 'MONTHLY_RECAP');

-- CreateEnum
CREATE TYPE "ShareTheme" AS ENUM ('SIGNATURE', 'ON_FIRE', 'PEPPER_COUNTRY', 'MINIMAL', 'CELEBRATION', 'SOCIAL');

-- CreateEnum
CREATE TYPE "ShareSize" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'STORY', 'SQUARE');

-- CreateEnum
CREATE TYPE "ShareEventType" AS ENUM ('STUDIO_OPENED', 'TYPE_SELECTED', 'TEMPLATE_SELECTED', 'IMAGE_GENERATED', 'IMAGE_SAVED', 'NATIVE_SHARE_CLICKED', 'CAPTION_COPIED');


-- DropTable (see note above)
DROP TABLE "ShareCard";

-- DropEnum
DROP TYPE "ShareVariant";

-- CreateTable
CREATE TABLE "ShareCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "kind" "ShareKind" NOT NULL,
    "theme" "ShareTheme" NOT NULL,
    "size" "ShareSize" NOT NULL,
    "streak" INTEGER NOT NULL,
    "longestStreak" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "consistency" INTEGER NOT NULL,
    "daysSinceStart" INTEGER NOT NULL,
    "startedOnLabel" TEXT,
    "todayLabel" TEXT,
    "amountLabel" TEXT,
    "methodLabel" TEXT,
    "methodIcon" TEXT,
    "achievementTitle" TEXT,
    "achievementBlurb" TEXT,
    "achievementValue" INTEGER,
    "challengeTitle" TEXT,
    "challengeDay" INTEGER,
    "challengeTotal" INTEGER,
    "monthLabel" TEXT,
    "monthDaysLogged" INTEGER,
    "monthDaysTotal" INTEGER,
    "monthAchievements" INTEGER,
    "quoteText" VARCHAR(240),
    "showStreak" BOOLEAN NOT NULL DEFAULT true,
    "showTotalDays" BOOLEAN NOT NULL DEFAULT true,
    "showLongestStreak" BOOLEAN NOT NULL DEFAULT true,
    "showConsistency" BOOLEAN NOT NULL DEFAULT false,
    "showChallenge" BOOLEAN NOT NULL DEFAULT false,
    "showAmount" BOOLEAN NOT NULL DEFAULT false,
    "showMethod" BOOLEAN NOT NULL DEFAULT false,
    "showStartDate" BOOLEAN NOT NULL DEFAULT false,
    "showAchievement" BOOLEAN NOT NULL DEFAULT false,
    "showQuote" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShareCard_token_key" ON "ShareCard"("token");

-- CreateIndex
CREATE INDEX "ShareCard_userId_createdAt_idx" ON "ShareCard"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShareCard" ADD CONSTRAINT "ShareCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ShareEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "event" "ShareEventType" NOT NULL,
    "kind" "ShareKind",
    "theme" "ShareTheme",
    "size" "ShareSize",
    "captionStyle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShareEvent_userId_createdAt_idx" ON "ShareEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareEvent_event_createdAt_idx" ON "ShareEvent"("event", "createdAt");

-- AddForeignKey
ALTER TABLE "ShareEvent" ADD CONSTRAINT "ShareEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

