import { describe, expect, it } from 'vitest';
import { majorArcana } from './major-arcana';
import { getSpreadBySlug, templeSpreads } from './spreads';

describe('temple spreads', () => {
  it('defines the five supported spreads in display order', () => {
    expect(templeSpreads.map((spread) => spread.slug)).toEqual([
      'single-answer',
      'two-path',
      'classic-triangle',
      'decision',
      'major-cross',
    ]);
  });

  it('defines the major cross positions in the required cross order', () => {
    expect(getSpreadBySlug('major-cross')).toMatchObject({
      cardCount: 5,
      positions: [
        { key: 'support', label: '有利因素', revealOrder: 0, slot: 'left' },
        { key: 'obstacle', label: '阻碍挑战', revealOrder: 1, slot: 'right' },
        { key: 'truth', label: '真相', revealOrder: 2, slot: 'top' },
        { key: 'root', label: '根源', revealOrder: 3, slot: 'bottom' },
        { key: 'outcome', label: '结果', revealOrder: 4, slot: 'center' },
      ],
    });
  });

  it('returns null for unknown spread slug', () => {
    expect(getSpreadBySlug('unknown')).toBeNull();
  });
});

describe('major arcana', () => {
  it('contains exactly 22 cards with Roman numerals and image paths', () => {
    expect(majorArcana).toHaveLength(22);
    expect(majorArcana[0]).toMatchObject({
      key: 'the-fool',
      nameCn: '愚者',
      romanIndex: '0',
      imagePath: '/tarot/the-fool.png',
    });
    expect(majorArcana.at(-1)).toMatchObject({
      key: 'the-world',
      nameCn: '世界',
      romanIndex: 'XXI',
      imagePath: '/tarot/the-world.png',
    });
  });
});
