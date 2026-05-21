import { describe, expect, it } from 'vitest';
import { parseTarotQuestion } from './validation';

describe('tarot question validation', () => {
  it('rejects blank questions', () => {
    expect(parseTarotQuestion('   ')).toEqual({ ok: false, error: '请先写下想询问的问题。' });
  });

  it('rejects questions over 300 characters', () => {
    expect(parseTarotQuestion('问'.repeat(301))).toEqual({ ok: false, error: '问题太长了，请先收束成一句话。' });
  });

  it('trims valid questions', () => {
    expect(parseTarotQuestion('  我该如何面对明天？  ')).toEqual({ ok: true, question: '我该如何面对明天？' });
  });
});
