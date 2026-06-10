/*
  Warnings:

  - You are about to drop the column `pricePerNight` on the `Accommodation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Accommodation" DROP COLUMN "pricePerNight",
ADD COLUMN     "totalPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "partySize" INTEGER NOT NULL DEFAULT 1;
