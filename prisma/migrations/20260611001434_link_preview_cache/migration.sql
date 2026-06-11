-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN     "previewDescription" TEXT;

-- CreateTable
CREATE TABLE "LinkPreviewCache" (
    "url" TEXT NOT NULL,
    "imageUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkPreviewCache_pkey" PRIMARY KEY ("url")
);
