import type { Prisma, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { createDefaultTarotAiProvider, TarotAiProviderError } from './ai-provider';
import { drawTarotCards } from './cards';
import type { TarotAiProvider, TarotDrawnCard, TarotReadingView, TempleActionResult } from './types';
import { parseTarotQuestion } from './validation';

type TempleResident = {
  id: string;
  name?: string | null;
  role: UserRole;
};

type TarotReadingRecord = {
  id: string;
  question: string;
  cards: Prisma.JsonValue;
  reading: string;
  createdAt: Date;
};

const aiUnavailableMessage = '今晚雾太重，请稍后再来。';

export function toTarotReadingView(record: TarotReadingRecord): TarotReadingView {
  return {
    id: record.id,
    question: record.question,
    cards: record.cards as TarotDrawnCard[],
    reading: record.reading,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function createTarotReading(
  resident: TempleResident | null,
  input: string,
  provider: TarotAiProvider = createDefaultTarotAiProvider(),
  drawCards = drawTarotCards,
): Promise<TempleActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录再进入寺庙。' };
  }

  const parsed = parseTarotQuestion(input);

  if (!parsed.ok) {
    return parsed;
  }

  const cards = drawCards();
  let reading: string;

  try {
    reading = await provider.generateReading({ question: parsed.question, cards });
  } catch (error) {
    if (error instanceof TarotAiProviderError) {
      return { ok: false, error: aiUnavailableMessage };
    }

    return { ok: false, error: aiUnavailableMessage };
  }

  const record = await db.tarotReading.create({
    data: {
      userId: resident.id,
      question: parsed.question,
      cards,
      reading,
    },
  });

  return { ok: true, reading: toTarotReadingView(record) };
}

export async function listTarotReadings(resident: TempleResident | null, take = 20) {
  if (!resident) {
    return [];
  }

  const readings = await db.tarotReading.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    where: { userId: resident.id },
  });

  return readings.map(toTarotReadingView);
}
