import { describe, expect, it } from 'vitest';
import { parseTempleQuestionInput } from './validation';

describe('parseTempleQuestionInput', () => {
  it('rejects an unknown spread slug', () => {
    expect(parseTempleQuestionInput('unknown', '今晚会顺利吗？')).toEqual({
      ok: false,
      error: '这座牌阵暂时还没有开放。',
    });
  });

  it('rejects blank questions', () => {
    expect(parseTempleQuestionInput('single-answer', '   ')).toEqual({
      ok: false,
      error: '请先说出你想问的问题。',
    });
  });

  it('rejects questions over 300 characters', () => {
    expect(parseTempleQuestionInput('decision', '问'.repeat(301))).toEqual({
      ok: false,
      error: '这个问题太长了，先收束成一句吧。',
    });
  });

  it('trims valid spread and question', () => {
    expect(parseTempleQuestionInput('decision', '  我要不要换工作？  ')).toEqual({
      ok: true,
      spreadSlug: 'decision',
      question: '我要不要换工作？',
    });
  });
});
