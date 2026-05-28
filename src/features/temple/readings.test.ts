import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TarotAiProviderError } from './ai-provider';
import { buildTempleInterpretationPrompt, finalizeTarotReading, listTarotReadings, prepareTarotReading } from './readings';
import type { TarotAiProvider, TempleDrawnCardView } from './types';

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

const cards: TempleDrawnCardView[] = [
  {
    positionKey: 'result',
    positionLabel: '结果',
    revealOrder: 0,
    cardKey: 'the-sun',
    cardNameCn: '太阳',
    romanIndex: 'XIX',
    orientation: 'upright',
    imagePath: '/tarot/the-sun.png',
  },
  {
    positionKey: 'advice',
    positionLabel: '对策',
    revealOrder: 1,
    cardKey: 'the-hermit',
    cardNameCn: '隐者',
    romanIndex: 'IX',
    orientation: 'reversed',
    imagePath: '/tarot/the-hermit.png',
  },
];

function fakeProvider(reading = '问题回响\n\n结果……\n\n总结启示……'): TarotAiProvider {
  return {
    generateReading: vi.fn().mockResolvedValue(reading),
  };
}

describe('temple reading services', () => {
  beforeEach(() => {
    readingCreate.mockReset();
    readingFindMany.mockReset();
  });

  it('formats AI prompt with question, spread, strict sections, and single-turn constraints', () => {
    const prompt = buildTempleInterpretationPrompt({
      spreadTitle: '五牌 · 大阿卡那十字',
      question: '我要不要离开现在的团队？',
      cards: [
        {
          positionKey: 'support',
          positionLabel: '有利因素',
          revealOrder: 0,
          cardKey: 'the-sun',
          cardNameCn: '太阳',
          romanIndex: 'XIX',
          orientation: 'upright',
          imagePath: '/tarot/the-sun.png',
        },
        {
          positionKey: 'obstacle',
          positionLabel: '阻碍挑战',
          revealOrder: 1,
          cardKey: 'the-devil',
          cardNameCn: '恶魔',
          romanIndex: 'XV',
          orientation: 'reversed',
          imagePath: '/tarot/the-devil.png',
        },
      ],
    });

    expect(prompt).toContain('有利因素：「XIX」太阳 正位');
    expect(prompt).toContain('阻碍挑战：「XV」恶魔 逆位');
    expect(prompt).toContain('用户不会再向你发送下一条消息');
    expect(prompt).toContain('绝对不要邀请用户继续讨论');
    expect(prompt).toContain('## 问题回响');
    expect(prompt).toContain('## 逐牌解读');
    expect(prompt).toContain('## 总结启示');
    expect(prompt).toContain('最后一句必须是封口式总结');
  });

  it('rejects guest draw preparation', async () => {
    await expect(prepareTarotReading(null, 'two-path', 'hello', () => cards)).resolves.toEqual({ ok: false, error: '请先登录再进入寺庙。' });
  });

  it('rejects invalid questions before drawing cards', async () => {
    const drawCards = vi.fn().mockReturnValue(cards);

    await expect(prepareTarotReading(resident, 'two-path', '   ', drawCards)).resolves.toEqual({ ok: false, error: '请先说出你想问的问题。' });
    expect(drawCards).not.toHaveBeenCalled();
    expect(readingCreate).not.toHaveBeenCalled();
  });

  it('prepares spread-aware card draws without calling AI or persistence', async () => {
    const drawCards = vi.fn().mockReturnValue(cards);

    await expect(prepareTarotReading(resident, 'two-path', ' 要不要表白？ ', drawCards)).resolves.toEqual({
      ok: true,
      prepared: {
        spreadSlug: 'two-path',
        spreadTitle: '二牌 · 修炼',
        question: '要不要表白？',
        cards,
      },
    });

    expect(drawCards).toHaveBeenCalledWith('two-path');
    expect(readingCreate).not.toHaveBeenCalled();
  });

  it('rejects guest finalization', async () => {
    await expect(
      finalizeTarotReading(
        null,
        {
          spreadSlug: 'two-path',
          spreadTitle: '二牌 · 修炼',
          question: '要不要表白？',
          cards,
        },
        fakeProvider(),
      ),
    ).resolves.toEqual({ ok: false, error: '请先登录再进入寺庙。' });
  });

  it('stores spread-aware card draws with reveal order and orientation after interpretation', async () => {
    const provider = fakeProvider('问题回响\n\n逐牌解读\n\n总结启示');
    readingCreate.mockResolvedValue({
      id: 'reading_1',
      userId: 'user_1',
      spreadType: 'two-path',
      question: '要不要表白？',
      reading: '问题回响\n\n逐牌解读\n\n总结启示',
      createdAt: new Date('2026-05-24T12:00:00.000Z'),
      cards: cards.map((card) => ({ ...card, id: `${card.positionKey}-1`, readingId: 'reading_1' })),
    });

    await expect(
      finalizeTarotReading(
        resident,
        {
          spreadSlug: 'two-path',
          spreadTitle: '二牌 · 修炼',
          question: '要不要表白？',
          cards,
        },
        provider,
      ),
    ).resolves.toEqual({
      ok: true,
      reading: {
        id: 'reading_1',
        spreadSlug: 'two-path',
        spreadTitle: '二牌 · 修炼',
        question: '要不要表白？',
        reading: '问题回响\n\n逐牌解读\n\n总结启示',
        createdAt: '2026-05-24T12:00:00.000Z',
        cards,
      },
    });

    expect(provider.generateReading).toHaveBeenCalledWith({
      spreadSlug: 'two-path',
      spreadTitle: '二牌 · 修炼',
      question: '要不要表白？',
      cards,
    });
    expect(readingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_1',
          spreadType: 'two-path',
          question: '要不要表白？',
          cards: {
            create: [
              expect.objectContaining({ positionKey: 'result', revealOrder: 0 }),
              expect.objectContaining({ positionKey: 'advice', revealOrder: 1 }),
            ],
          },
        }),
      }),
    );
  });

  it('does not persist readings when provider fails during finalization', async () => {
    const provider: TarotAiProvider = {
      generateReading: vi.fn().mockRejectedValue(new TarotAiProviderError('http_error')),
    };

    await expect(
      finalizeTarotReading(
        resident,
        {
          spreadSlug: 'two-path',
          spreadTitle: '二牌 · 修炼',
          question: '明天会怎样？',
          cards,
        },
        provider,
      ),
    ).resolves.toEqual({ ok: false, error: '今晚雾太重，请稍后再来。' });
    expect(readingCreate).not.toHaveBeenCalled();
  });

  it('lists only current resident reading history', async () => {
    readingFindMany.mockResolvedValue([
      {
        id: 'reading_1',
        userId: 'user_1',
        spreadType: 'two-path',
        question: '明天会怎样？',
        reading: '慢慢来。',
        createdAt: new Date('2026-05-21T12:00:00.000Z'),
        cards: cards.map((card) => ({ ...card, id: `${card.positionKey}-1`, readingId: 'reading_1' })),
      },
    ]);

    await expect(listTarotReadings(resident)).resolves.toEqual([
      {
        id: 'reading_1',
        spreadSlug: 'two-path',
        spreadTitle: '二牌 · 修炼',
        question: '明天会怎样？',
        cards,
        reading: '慢慢来。',
        createdAt: '2026-05-21T12:00:00.000Z',
      },
    ]);
    expect(readingFindMany).toHaveBeenCalledWith({
      include: { cards: { orderBy: { revealOrder: 'asc' } } },
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
