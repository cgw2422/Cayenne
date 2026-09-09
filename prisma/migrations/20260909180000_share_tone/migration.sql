-- "Make it personal": the card's headline gets a personality.
--
-- Tone changes the words on a card, never the numbers, so existing cards keep
-- rendering exactly as published — they simply gain an explicit tone matching
-- the voice they were written with.

-- CreateEnum
CREATE TYPE "ShareTone" AS ENUM ('CLEAN', 'FUNNY', 'MOTIVATIONAL', 'PROUD');

-- AlterTable
ALTER TABLE "ShareCard" ADD COLUMN "tone" "ShareTone" NOT NULL DEFAULT 'FUNNY';
