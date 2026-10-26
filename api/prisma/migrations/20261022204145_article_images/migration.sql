-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
