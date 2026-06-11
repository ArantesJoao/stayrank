/*
  Warnings:

  - You are about to drop the column `note` on the `AccommodationContributor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccommodationContributor" DROP COLUMN "note",
ADD COLUMN     "cons" TEXT,
ADD COLUMN     "pros" TEXT;
