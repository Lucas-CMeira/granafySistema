-- AlterTable
ALTER TABLE "entry" ADD COLUMN     "skipped_months" TEXT[] DEFAULT ARRAY[]::TEXT[];
