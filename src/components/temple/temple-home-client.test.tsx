import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TempleHomeClient } from './temple-home-client';

describe('TempleHomeClient', () => {
  it('renders the five spread choices and no history list', () => {
    render(
      <TempleHomeClient
        spreads={[
          { slug: 'single-answer', title: '单牌 · 对答', subtitle: '启示' },
          { slug: 'two-path', title: '二牌 · 修炼', subtitle: '结果 + 对策' },
          { slug: 'classic-triangle', title: '三牌 · 经典圣三角', subtitle: '过去 + 现在 + 未来' },
          { slug: 'decision', title: '三牌 · 决策', subtitle: '心态 + 现状 + 结果' },
          { slug: 'major-cross', title: '五牌 · 大阿卡那十字', subtitle: '有利因素 + 阻碍挑战 + 真相 + 根源 + 结果' },
        ]}
      />,
    );

    expect(screen.getByText('占卜寺庙')).toBeInTheDocument();
    expect(screen.getByText('五牌 · 大阿卡那十字')).toBeInTheDocument();
    expect(screen.queryByText('PRIVATE READING')).toBeNull();
  });
});
