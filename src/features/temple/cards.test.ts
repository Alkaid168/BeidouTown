import { describe, expect, it } from 'vitest';
import { drawTarotCards } from './cards';

describe('drawTarotCards', () => {
  it('draws the configured number of cards for the spread', () => {
    expect(drawTarotCards('single-answer', () => 0.1)).toHaveLength(1);
    expect(drawTarotCards('two-path', () => 0.1)).toHaveLength(2);
    expect(drawTarotCards('major-cross', () => 0.1)).toHaveLength(5);
  });

  it('assigns spread position metadata from the spread definition', () => {
    expect(drawTarotCards('classic-triangle', () => 0.1).map((card) => card.positionLabel)).toEqual(['过去', '现在', '未来']);
  });

  it('does not draw duplicate cards', () => {
    const cards = drawTarotCards('decision', () => 0.1);
    expect(new Set(cards.map((card) => card.cardKey)).size).toBe(3);
  });

  it('uses injectable randomness for orientation', () => {
    const values = [0, 0.2, 0.1, 0.8, 0.2, 0.3];
    const cards = drawTarotCards('decision', () => values.shift() ?? 0);

    expect(cards.map((card) => card.orientation)).toEqual(['upright', 'reversed', 'upright']);
  });
});
