import { getSpreadBySlug, type TempleSpreadSlug } from './spreads';

export const MAX_TAROT_QUESTION_LENGTH = 300;

type TarotQuestionResult =
  | { ok: true; question: string }
  | { ok: false; error: string };

export function parseTarotQuestion(input: string): TarotQuestionResult {
  const question = input.trim();

  if (!question) {
    return { ok: false, error: '请先写下想询问的问题。' };
  }

  if (question.length > MAX_TAROT_QUESTION_LENGTH) {
    return { ok: false, error: '问题太长了，请先收束成一句话。' };
  }

  return { ok: true, question };
}

export function parseTempleQuestionInput(spreadSlugInput: string, questionInput: string) {
  const spreadSlug = spreadSlugInput.trim() as TempleSpreadSlug;
  const question = questionInput.trim();

  if (!getSpreadBySlug(spreadSlug)) {
    return { ok: false as const, error: '这座牌阵暂时还没有开放。' };
  }

  if (!question) {
    return { ok: false as const, error: '请先说出你想问的问题。' };
  }

  if (question.length > MAX_TAROT_QUESTION_LENGTH) {
    return { ok: false as const, error: '这个问题太长了，先收束成一句吧。' };
  }

  return { ok: true as const, spreadSlug, question };
}
