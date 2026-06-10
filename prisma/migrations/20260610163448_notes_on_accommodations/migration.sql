/*
  Warnings:

  - You are about to drop the column `note` on the `Ranking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccommodationContributor" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "Ranking" DROP COLUMN "note";
