import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TempleCard } from './temple-card';

describe('TempleCard', () => {
  it('shows the revealed face image after click-triggered reveal state', () => {
    const onReveal = vi.fn();
    const { rerender } = render(
      <TempleCard
        active
        cardNameCn="太阳"
        disabled={false}
        imagePath="/tarot/the-sun.png"
        onReveal={onReveal}
        orientation="upright"
        positionLabel="结果"
        revealed={false}
        romanIndex="XIX"
      />,
    );

    fireEvent.click(screen.getByLabelText('翻开结果'));
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(screen.getByAltText('塔罗牌背')).toBeInTheDocument();

    rerender(
      <TempleCard
        active={false}
        cardNameCn="太阳"
        disabled
        imagePath="/tarot/the-sun.png"
        onReveal={onReveal}
        orientation="upright"
        positionLabel="结果"
        revealed
        romanIndex="XIX"
      />,
    );

    expect(screen.getByAltText('太阳')).toBeInTheDocument();
    expect(screen.getByText('「XIX」太阳 正位')).toBeInTheDocument();
  });
});
