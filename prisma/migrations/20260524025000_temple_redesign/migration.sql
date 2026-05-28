-- Temple redesign: migrate spread-aware tarot readings.
ALTER TABLE "TarotReading" ADD COLUMN "spreadType" TEXT NOT NULL DEFAULT 'classic-triangle';

CREATE TABLE "TarotReadingCard" (
  "id" TEXT NOT NULL,
  "readingId" TEXT NOT NULL,
  "positionKey" TEXT NOT NULL,
  "positionLabel" TEXT NOT NULL,
  "revealOrder" INTEGER NOT NULL,
  "cardKey" TEXT NOT NULL,
  "cardNameCn" TEXT NOT NULL,
  "romanIndex" TEXT NOT NULL,
  "orientation" TEXT NOT NULL,
  "imagePath" TEXT NOT NULL,
  CONSTRAINT "TarotReadingCard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TarotReading_userId_createdAt_idx" ON "TarotReading"("userId", "createdAt");
CREATE INDEX "TarotReadingCard_readingId_revealOrder_idx" ON "TarotReadingCard"("readingId", "revealOrder");

ALTER TABLE "TarotReadingCard"
  ADD CONSTRAINT "TarotReadingCard_readingId_fkey"
  FOREIGN KEY ("readingId") REFERENCES "TarotReading"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing readings where possible by converting the old JSON cards array
-- into classic-triangle rows. Position labels are taken from stored data.
INSERT INTO "TarotReadingCard" (
  "id",
  "readingId",
  "positionKey",
  "positionLabel",
  "revealOrder",
  "cardKey",
  "cardNameCn",
  "romanIndex",
  "orientation",
  "imagePath"
)
SELECT
  gen_random_uuid()::text,
  tr."id",
  CASE COALESCE(card.value->>'position', '')
    WHEN '过去' THEN 'past'
    WHEN '现在' THEN 'present'
    WHEN '未来' THEN 'future'
    WHEN '可能的方向' THEN 'future'
    ELSE 'past'
  END,
  COALESCE(card.value->>'position', '过去'),
  card.ordinality - 1,
  COALESCE(card.value->>'key', 'unknown-card'),
  COALESCE(card.value->>'name', '未知牌'),
  COALESCE(card.value->>'romanIndex', '?'),
  COALESCE(card.value->>'orientation', 'upright'),
  COALESCE(card.value->>'imagePath', '/tarot/unknown.png')
FROM "TarotReading" tr,
LATERAL jsonb_array_elements(tr."cards"::jsonb) WITH ORDINALITY AS card(value, ordinality);

ALTER TABLE "TarotReading" DROP COLUMN "cards";
