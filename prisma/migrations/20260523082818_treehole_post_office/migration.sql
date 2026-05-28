-- AlterTable
ALTER TABLE "TreeholePost" ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

UPDATE "TreeholePost"
SET
  "title" = COALESCE(NULLIF(LEFT(REGEXP_REPLACE("content", E'\\s+', ' ', 'g'), 40), ''), '未命名的信'),
  "updatedAt" = "createdAt"
WHERE "title" IS NULL OR "updatedAt" IS NULL;

ALTER TABLE "TreeholePost"
ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateTable
CREATE TABLE "TreeholeReply" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreeholeReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreeholeReply_postId_createdAt_idx" ON "TreeholeReply"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "TreeholeReply_authorId_idx" ON "TreeholeReply"("authorId");

-- AddForeignKey
ALTER TABLE "TreeholeReply" ADD CONSTRAINT "TreeholeReply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "TreeholePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreeholeReply" ADD CONSTRAINT "TreeholeReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
