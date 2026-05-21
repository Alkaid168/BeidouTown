import { describe, expect, it } from 'vitest';
import { parseTavernMessageContent } from './validation';

describe('parseTavernMessageContent', () => {
  it('trims surrounding whitespace and accepts multiline markdown', () => {
    expect(parseTavernMessageContent('  hello\n**world**  ')).toEqual({ ok: true, content: 'hello\n**world**' });
  });

  it('rejects empty content', () => {
    expect(parseTavernMessageContent('   \n   ')).toEqual({ ok: false, error: '不能发送空消息。' });
  });

  it('rejects content over 500 characters', () => {
    expect(parseTavernMessageContent('a'.repeat(501))).toEqual({ ok: false, error: '这句话太长了，先拆成几段吧。' });
  });
});
