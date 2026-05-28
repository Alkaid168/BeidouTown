import type { ReactNode } from 'react';

export function TempleSpreadLayout({
  spreadSlug,
  cards,
}: {
  spreadSlug: string;
  cards: Array<{ positionKey: string; positionLabel: string; slot: string; content: ReactNode }>;
}) {
  if (spreadSlug === 'major-cross') {
    const bySlot = Object.fromEntries(cards.map((card) => [card.slot, card]));

    return (
      <div className="mx-auto grid w-full max-w-4xl grid-cols-3 gap-6" style={{ gridTemplateAreas: '". top ." "left center right" ". bottom ."' }}>
        <div data-testid="temple-slot-top" style={{ gridArea: 'top' }}>{bySlot.top?.positionLabel}{bySlot.top?.content}</div>
        <div data-testid="temple-slot-left" style={{ gridArea: 'left' }}>{bySlot.left?.positionLabel}{bySlot.left?.content}</div>
        <div data-testid="temple-slot-center" style={{ gridArea: 'center' }}>{bySlot.center?.positionLabel}{bySlot.center?.content}</div>
        <div data-testid="temple-slot-right" style={{ gridArea: 'right' }}>{bySlot.right?.positionLabel}{bySlot.right?.content}</div>
        <div data-testid="temple-slot-bottom" style={{ gridArea: 'bottom' }}>{bySlot.bottom?.positionLabel}{bySlot.bottom?.content}</div>
      </div>
    );
  }

  return (
    <div className={`mx-auto grid w-full max-w-4xl gap-6 ${cards.length === 1 ? 'grid-cols-1' : cards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
      {cards.map((card) => (
        <div key={card.positionKey}>
          {card.positionLabel}
          {card.content}
        </div>
      ))}
    </div>
  );
}
