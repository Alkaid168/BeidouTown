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
