import { describe, expect, it } from 'vitest';
import { parseTreeholePostInput, parseTreeholeReplyContent } from './validation';

describe('treehole post validation', () => {
  it('defaults empty title to 无题', () => {
    expect(parseTreeholePostInput('   ', '内容')).toEqual({ ok: true, title: '无题', content: '内容' });
  });

  it('rejects empty content', () => {
    expect(parseTreeholePostInput('标题', '   ')).toEqual({ ok: false, error: '不能投递空白信件。' });
  });

  it('rejects title over 40 characters', () => {
    expect(parseTreeholePostInput('x'.repeat(41), '内容')).toEqual({ ok: false, error: '标题太长了，先收束成一句吧。' });
  });

  it('rejects content over 1000 characters', () => {
    expect(parseTreeholePostInput('标题', 'x'.repeat(1001))).toEqual({ ok: false, error: '这封信太长了，先拆成几封吧。' });
  });

  it('trims valid title and content', () => {
    expect(parseTreeholePostInput('  晚安  ', '  北斗镇。  ')).toEqual({ ok: true, title: '晚安', content: '北斗镇。' });
  });
});

describe('treehole reply validation', () => {
  it('rejects empty reply content', () => {
    expect(parseTreeholeReplyContent('   ')).toEqual({ ok: false, error: '不能回复空白内容。' });
  });

  it('rejects reply content over 500 characters', () => {
    expect(parseTreeholeReplyContent('x'.repeat(501))).toEqual({ ok: false, error: '回复太长了，稍微短一点吧。' });
  });

  it('trims valid reply content', () => {
    expect(parseTreeholeReplyContent('  愿你今晚好梦。  ')).toEqual({ ok: true, content: '愿你今晚好梦。' });
  });
});
