-- Share lines.
--
-- A card now records exactly which line it was published with — either an index
-- into the matched pool or the user's own words — so a shared link keeps the
-- wording it had when it was posted, even as the library grows.

-- AlterTable
ALTER TABLE "ShareCard" ADD COLUMN "lineIndex" INTEGER,
ADD COLUMN "customLine" VARCHAR(120);
