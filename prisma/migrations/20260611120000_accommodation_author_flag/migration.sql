-- AlterTable
ALTER TABLE "AccommodationContributor" ADD COLUMN "isAuthor" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: the original author of each accommodation (Accommodation.addedById)
-- is a co-author contributor, so existing cards keep crediting whoever added them.
UPDATE "AccommodationContributor" c
SET "isAuthor" = true
FROM "Accommodation" a
WHERE c."accommodationId" = a."id" AND c."userId" = a."addedById";
