-- CreateEnum
CREATE TYPE "TavernMessageDeleteReason" AS ENUM ('WITHDRAWN', 'MODERATED');

-- AlterTable
ALTER TABLE "TavernMessage" ADD COLUMN     "deleteReason" "TavernMessageDeleteReason",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT;

-- CreateIndex
CREATE INDEX "TavernMessage_deletedById_idx" ON "TavernMessage"("deletedById");
