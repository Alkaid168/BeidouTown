import { describe, expect, it } from 'vitest';
import { drawTarotCards } from './cards';

describe('drawTarotCards', () => {
  it('draws three cards', () => {
    expect(drawTarotCards(() => 0.1)).toHaveLength(3);
  });

  it('assigns past, present, and direction positions', () => {
    expect(drawTarotCards(() => 0.1).map((card) => card.position)).toEqual(['过去', '现在', '可能的方向']);
  });

  it('does not draw duplicate cards', () => {
    const cards = drawTarotCards(() => 0.1);
    expect(new Set(cards.map((card) => card.name)).size).toBe(3);
  });

  it('uses injectable randomness for orientation', () => {
    const values = [0, 0.2, 0.1, 0.8, 0.2, 0.3];
    const cards = drawTarotCards(() => values.shift() ?? 0);

    expect(cards.map((card) => card.orientation)).toEqual(['upright', 'reversed', 'upright']);
  });
});
