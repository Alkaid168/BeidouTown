import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TarotAiProviderError } from './ai-provider';
import { createTarotReading, listTarotReadings } from './readings';
import type { TarotAiProvider, TarotDrawnCard } from './types';

const { readingCreate, readingFindMany } = vi.hoisted(() => ({
  readingCreate: vi.fn(),
  readingFindMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    tarotReading: {
      create: readingCreate,
      findMany: readingFindMany,
    },
  },
}));

const resident = { id: 'user_1', role: UserRole.USER, name: 'Alice' };

const cards: TarotDrawnCard[] = [
  { name: '星星', arcana: 'major', orientation: 'upright', position: '过去', meaning: '希望' },
  { name: '月亮', arcana: 'major', orientation: 'reversed', position: '现在', meaning: '迷雾' },
  { name: '太阳', arcana: 'major', orientation: 'upright', position: '可能的方向', meaning: '明朗' },
];

function fakeProvider(reading = '星光会照亮你。'): TarotAiProvider {
  return {
    generateReading: vi.fn().mockResolvedValue(reading),
  };
}

describe('temple reading services', () => {
  beforeEach(() => {
    readingCreate.mockReset();
    readingFindMany.mockReset();
  });

  it('rejects guest readings', async () => {
    await expect(createTarotReading(null, 'hello', fakeProvider(), () => cards)).resolves.toEqual({ ok: false, error: '请先登录再进入寺庙。' });
  });

  it('rejects invalid questions before calling provider', async () => {
    const provider = fakeProvider();

    await expect(createTarotReading(resident, '   ', provider, () => cards)).resolves.toEqual({ ok: false, error: '请先写下想询问的问题。' });
    expect(provider.generateReading).not.toHaveBeenCalled();
    expect(readingCreate).not.toHaveBeenCalled();
  });

  it('creates a successful tarot reading', async () => {
    const provider = fakeProvider('请向晨星走去。');
    readingCreate.mockResolvedValue({
      id: 'reading_1',
      userId: 'user_1',
      question: '我该如何面对明天？',
      cards,
      reading: '请向晨星走去。',
      createdAt: new Date('2026-05-21T12:00:00.000Z'),
    });

    await expect(createTarotReading(resident, ' 我该如何面对明天？ ', provider, () => cards)).resolves.toEqual({
      ok: true,
      reading: {
        id: 'reading_1',
        question: '我该如何面对明天？',
        cards,
        reading: '请向晨星走去。',
        createdAt: '2026-05-21T12:00:00.000Z',
      },
    });
    expect(provider.generateReading).toHaveBeenCalledWith({ question: '我该如何面对明天？', cards });
    expect(readingCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        question: '我该如何面对明天？',
        cards,
        reading: '请向晨星走去。',
      },
    });
  });

  it('does not persist readings when provider fails', async () => {
    const provider: TarotAiProvider = {
      generateReading: vi.fn().mockRejectedValue(new TarotAiProviderError('http_error')),
    };

    await expect(createTarotReading(resident, '明天会怎样？', provider, () => cards)).resolves.toEqual({ ok: false, error: '今晚雾太重，请稍后再来。' });
    expect(readingCreate).not.toHaveBeenCalled();
  });

  it('lists only current resident reading history', async () => {
    readingFindMany.mockResolvedValue([
      {
        id: 'reading_1',
        userId: 'user_1',
        question: '明天会怎样？',
        cards,
        reading: '慢慢来。',
        createdAt: new Date('2026-05-21T12:00:00.000Z'),
      },
    ]);

    await expect(listTarotReadings(resident)).resolves.toEqual([
      {
        id: 'reading_1',
        question: '明天会怎样？',
        cards,
        reading: '慢慢来。',
        createdAt: '2026-05-21T12:00:00.000Z',
      },
    ]);
    expect(readingFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      take: 20,
      where: { userId: 'user_1' },
    });
  });

  it('returns empty history for guests', async () => {
    await expect(listTarotReadings(null)).resolves.toEqual([]);
    expect(readingFindMany).not.toHaveBeenCalled();
  });
});
