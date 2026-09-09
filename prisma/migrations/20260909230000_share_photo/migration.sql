-- The optional photo Journey template. A photo only ever exists because the
-- user picked one for a card they were about to post.
ALTER TYPE "ShareTheme" ADD VALUE IF NOT EXISTS 'PHOTO';

CREATE TABLE "SharePhoto" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "mime"      VARCHAR(32) NOT NULL,
    "width"     INTEGER NOT NULL,
    "height"    INTEGER NOT NULL,
    "bytes"     BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharePhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SharePhoto_userId_createdAt_idx" ON "SharePhoto"("userId", "createdAt");

ALTER TABLE "SharePhoto" ADD CONSTRAINT "SharePhoto_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShareCard" ADD COLUMN "photoId" TEXT;

ALTER TABLE "ShareCard" ADD CONSTRAINT "ShareCard_photoId_fkey"
    FOREIGN KEY ("photoId") REFERENCES "SharePhoto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
