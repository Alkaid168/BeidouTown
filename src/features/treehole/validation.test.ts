import { describe, expect, it } from 'vitest';
import { parseTreeholePostContent } from './validation';

describe('treehole post validation', () => {
  it('rejects empty content', () => {
    expect(parseTreeholePostContent('   ')).toEqual({ ok: false, error: '不能投递空白信件。' });
  });

  it('rejects content over 1000 characters', () => {
    expect(parseTreeholePostContent('x'.repeat(1001))).toEqual({ ok: false, error: '这封信太长了，先拆成几封吧。' });
  });

  it('trims valid content', () => {
    expect(parseTreeholePostContent('  晚安，北斗镇。  ')).toEqual({ ok: true, content: '晚安，北斗镇。' });
  });
});
