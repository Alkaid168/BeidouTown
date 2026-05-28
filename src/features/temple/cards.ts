import { majorArcana } from './major-arcana';
import { getSpreadBySlug, type TempleSpreadSlug } from './spreads';
import type { TempleDrawnCardView, TarotOrientation } from './types';

function orientationFromRng(rng: () => number): TarotOrientation {
  return rng() < 0.5 ? 'upright' : 'reversed';
}

export function drawTarotCards(spreadSlug: TempleSpreadSlug, rng = Math.random): TempleDrawnCardView[] {
  const spread = getSpreadBySlug(spreadSlug);

  if (!spread) {
    throw new Error(`Unknown spread: ${spreadSlug}`);
  }

  const deck = [...majorArcana];

  return spread.positions.map((position) => {
    const index = Math.floor(rng() * deck.length);
    const [card] = deck.splice(index, 1);

    return {
      positionKey: position.key,
      positionLabel: position.label,
      revealOrder: position.revealOrder,
      cardKey: card.key,
      cardNameCn: card.nameCn,
      romanIndex: card.romanIndex,
      orientation: orientationFromRng(rng),
      imagePath: card.imagePath,
    };
  });
}
