import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeClient } from './home-client';
import { getAdaptiveStarLayout } from './star-layout';

vi.mock('@/features/residents/actions', () => ({
  logoutResidentAction: vi.fn(),
}));

describe('HomeClient', () => {
  it('renders a title-screen menu for guests', () => {
    render(<HomeClient resident={null} />);

    expect(screen.getByText('点击任意位置开始')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: '北斗镇记忆菜单' })).toHaveClass('transition-all');
    expect(screen.getByRole('link', { name: /新的开始/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /载入记忆/i })).toHaveAttribute('href', '/login');
  });

  it('renders the rotating Big Dipper navigation for residents', () => {
    render(<HomeClient resident={{ id: 'resident-1', name: '阿北', role: 'resident' }} />);

    expect(screen.getByText('BEIDOU TOWN').parentElement).toHaveClass('animate-[home-title-in_900ms_ease-out_both]');
    expect(screen.getByLabelText('缓缓旋转的北斗七星导航')).toHaveClass('animate-[home-constellation-in_1200ms_260ms_ease-out_both,beidou-orbit_96s_1.46s_linear_infinite]');
    expect(screen.getByLabelText('天枢 聊天酒馆')).not.toHaveClass('animate-[star-appear_900ms_ease-out_both,star-wander_12s_ease-in-out_infinite]');
    expect(screen.getByTestId('constellation-line')).toHaveAttribute('points');
    expect(screen.getByLabelText('缓缓旋转的北斗七星导航')).toHaveClass('scale-[0.86]');
    expect(screen.getByTestId('cursor-aura')).toHaveClass('size-48');
    expect(screen.getByRole('button', { name: '离去' })).toHaveClass('rounded-none');
    expect(screen.getByRole('link', { name: /天枢 聊天酒馆/ })).toHaveAttribute('href', '/tavern');
    expect(screen.getByRole('link', { name: /天璇 树洞邮局/ })).toHaveAttribute('href', '/treehole');
    expect(screen.getByRole('link', { name: /天玑 占卜寺庙/ })).toHaveAttribute('href', '/temple');
    expect(screen.getByLabelText('瑶光 沉睡中的地点')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/沉睡中的地点/)).toHaveLength(4);
  });

  it('uses the default layout coordinates before viewport-specific updates', () => {
    const defaultLayout = getAdaptiveStarLayout(16 / 9);

    expect(defaultLayout.stars[0]).toMatchObject({
      x: 21.657405371676425,
      y: 26.4695605261168,
    });
  });

  it('updates the rendered star coordinates after a resize event', async () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1600 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });

    try {
      render(<HomeClient resident={{ id: 'resident-1', name: '阿北', role: 'resident' }} />);
      const tavernStar = screen.getByRole('link', { name: /天枢 聊天酒馆/ });

      await act(async () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
        window.dispatchEvent(new Event('resize'));
      });

      expect(tavernStar).toHaveStyle({ left: '25.18%', top: '26.499%' });
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
    }
  });
});
