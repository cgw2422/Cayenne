-- Saved lines: a user's own wording, kept so a favourite can be reused rather
-- than retyped every time they post.

-- CreateTable
CREATE TABLE "SavedLine" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" VARCHAR(120) NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedLine_userId_text_key" ON "SavedLine"("userId", "text");

-- CreateIndex
CREATE INDEX "SavedLine_userId_usedAt_idx" ON "SavedLine"("userId", "usedAt");

-- AddForeignKey
ALTER TABLE "SavedLine" ADD CONSTRAINT "SavedLine_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
