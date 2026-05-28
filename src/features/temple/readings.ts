import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { createDefaultTarotAiProvider, TarotAiProviderError } from './ai-provider';
import { drawTarotCards } from './cards';
import { getSpreadBySlug, type TempleSpreadSlug } from './spreads';
import type { PreparedTarotReading, PrepareTempleReadingResult, TarotAiProvider, TarotReadingView, TempleActionResult, TempleDrawnCardView } from './types';
import { parseTempleQuestionInput } from './validation';

type TempleResident = {
  id: string;
  name?: string | null;
  role: UserRole;
};

type TarotReadingCardRecord = TempleDrawnCardView & {
  id?: string;
  readingId?: string;
};

type TarotReadingRecord = {
  id: string;
  spreadType: string;
  question: string;
  reading: string;
  createdAt: Date;
  cards: TarotReadingCardRecord[];
};

const aiUnavailableMessage = '今晚雾太重，请稍后再来。';

export function orientationLabel(orientation: 'upright' | 'reversed') {
  return orientation === 'upright' ? '正位' : '逆位';
}

export function buildTempleInterpretationPrompt(input: {
  spreadTitle: string;
  question: string;
  cards: Array<{
    positionLabel: string;
    romanIndex: string;
    cardNameCn: string;
    orientation: 'upright' | 'reversed';
  }>;
}) {
  const cardLines = input.cards
    .map((card) => `${card.positionLabel}：「${card.romanIndex}」${card.cardNameCn} ${orientationLabel(card.orientation)}`)
    .join('\n');

  return [
    '你是北斗镇占卜寺庙里的解读者，只负责完成这一次最终解读。',
    '这是单轮输出，用户不会再向你发送下一条消息。你必须把这一次回答写完整，不要留下待补充空间。',
    '绝对不要邀请用户继续讨论、继续提问、继续来找你、继续告诉你情况，也不要使用“如果你愿意”“如果你还想”“如果你需要”“欢迎再来”“可以继续聊”这类措辞。',
    '不要提出反问，不要给出下一步互动建议，不要以对话邀请结尾。结尾必须是收束性的总结，不得是开放式续聊。',
    '语气要求：温柔、安静、克制、带一点神秘感，但表达必须明确，不要空泛。',
    `牌阵：${input.spreadTitle}`,
    `问题：${input.question}`,
    '抽到的牌：',
    cardLines,
    '输出必须严格使用以下 Markdown 结构，标题名称一个字都不要改：',
    '## 问题回响',
    '先用 2 到 3 句话回应用户当下处境，直接切入，不要寒暄。',
    '## 逐牌解读',
    '这里必须按抽牌顺序逐张展开，每张牌各自单独成段。每段第一行必须写成：`位置：罗马数字 牌名 正/逆位`，例如：`结果：「XIX」太阳 正位`。随后紧接 2 到 3 句解释这张牌在这个位置上的含义。',
    '## 总结启示',
    '最后用 2 到 4 句话做收束，给出凝练、可执行、但不过度命令式的提醒。最后一句必须是封口式总结，不能把话题抛回给用户。',
    '禁止输出任何额外章节、附言、PS、免责声明式尾注，也不要在标题前后添加多余修饰符号。',
  ].join('\n');
}

export function toTarotReadingView(record: TarotReadingRecord): TarotReadingView {
  const spread = getSpreadBySlug(record.spreadType);

  return {
    id: record.id,
    spreadSlug: (spread?.slug ?? 'classic-triangle') as TempleSpreadSlug,
    spreadTitle: spread?.title ?? '三牌 · 经典圣三角',
    question: record.question,
    cards: record.cards.map((card) => ({
      positionKey: card.positionKey,
      positionLabel: card.positionLabel,
      revealOrder: card.revealOrder,
      cardKey: card.cardKey,
      cardNameCn: card.cardNameCn,
      romanIndex: card.romanIndex,
      orientation: card.orientation,
      imagePath: card.imagePath,
    })),
    reading: record.reading,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function prepareTarotReading(
  resident: TempleResident | null,
  spreadSlugInput: string,
  questionInput: string,
  drawCards = drawTarotCards,
): Promise<PrepareTempleReadingResult> {
  if (!resident) {
    return { ok: false, error: '请先登录再进入寺庙。' };
  }

  const parsed = parseTempleQuestionInput(spreadSlugInput, questionInput);

  if (!parsed.ok) {
    return parsed;
  }

  const spread = getSpreadBySlug(parsed.spreadSlug);
  if (!spread) {
    return { ok: false, error: '这座牌阵暂时还没有开放。' };
  }

  return {
    ok: true,
    prepared: {
      spreadSlug: parsed.spreadSlug,
      spreadTitle: spread.title,
      question: parsed.question,
      cards: drawCards(parsed.spreadSlug),
    },
  };
}

export async function finalizeTarotReading(
  resident: TempleResident | null,
  prepared: PreparedTarotReading,
  provider: TarotAiProvider = createDefaultTarotAiProvider(),
): Promise<TempleActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录再进入寺庙。' };
  }

  let reading: string;

  try {
    reading = await provider.generateReading({
      spreadSlug: prepared.spreadSlug,
      spreadTitle: prepared.spreadTitle,
      question: prepared.question,
      cards: prepared.cards,
    });
  } catch (error) {
    if (error instanceof TarotAiProviderError) {
      return { ok: false, error: aiUnavailableMessage };
    }

    return { ok: false, error: aiUnavailableMessage };
  }

  const record = await db.tarotReading.create({
    data: {
      userId: resident.id,
      spreadType: prepared.spreadSlug,
      question: prepared.question,
      reading,
      cards: {
        create: prepared.cards.map((card) => ({
          positionKey: card.positionKey,
          positionLabel: card.positionLabel,
          revealOrder: card.revealOrder,
          cardKey: card.cardKey,
          cardNameCn: card.cardNameCn,
          romanIndex: card.romanIndex,
          orientation: card.orientation,
          imagePath: card.imagePath,
        })),
      },
    },
    include: {
      cards: {
        orderBy: { revealOrder: 'asc' },
      },
    },
  });

  return { ok: true, reading: toTarotReadingView(record as TarotReadingRecord) };
}

export async function listTarotReadings(resident: TempleResident | null, take = 20) {
  if (!resident) {
    return [];
  }

  const readings = await db.tarotReading.findMany({
    include: { cards: { orderBy: { revealOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
    take,
    where: { userId: resident.id },
  });

  return readings.map((reading) => toTarotReadingView(reading as TarotReadingRecord));
}
