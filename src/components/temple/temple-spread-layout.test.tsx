import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TempleSpreadLayout } from './temple-spread-layout';

describe('TempleSpreadLayout', () => {
  it('renders the major cross in the required directional arrangement', () => {
    render(
      <TempleSpreadLayout
        spreadSlug="major-cross"
        cards={[
          { positionKey: 'support', positionLabel: '有利因素', slot: 'left', content: 'L' },
          { positionKey: 'obstacle', positionLabel: '阻碍挑战', slot: 'right', content: 'R' },
          { positionKey: 'truth', positionLabel: '真相', slot: 'top', content: 'T' },
          { positionKey: 'root', positionLabel: '根源', slot: 'bottom', content: 'B' },
          { positionKey: 'outcome', positionLabel: '结果', slot: 'center', content: 'C' },
        ]}
      />,
    );

    expect(screen.getByTestId('temple-slot-top')).toHaveTextContent('真相');
    expect(screen.getByTestId('temple-slot-left')).toHaveTextContent('有利因素');
    expect(screen.getByTestId('temple-slot-center')).toHaveTextContent('结果');
  });
});
