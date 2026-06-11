-- AlterTable
ALTER TABLE "Accommodation" ADD COLUMN     "previewAttemptedAt" TIMESTAMP(3),
ADD COLUMN     "previewStatus" TEXT NOT NULL DEFAULT 'PENDING';
