-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN     "previewFetchedAt" TIMESTAMP(3),
ADD COLUMN     "previewImageUrl" TEXT,
ADD COLUMN     "previewTitle" TEXT;

-- AlterTable
ALTER TABLE "City" ADD COLUMN     "imageCredit" TEXT,
ADD COLUMN     "imageCreditUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "imageCredit" TEXT,
ADD COLUMN     "imageCreditUrl" TEXT,
ADD COLUMN     "imageUrl" TEXT;
