import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeClient } from './home-client';
import { getAdaptiveStarLayout } from './star-layout';

vi.mock('@/features/residents/actions', () => ({
  logoutResidentAction: vi.fn(),
}));

describe('HomeClient', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('renders a shared intro gate for guests and shows guest links after starting', () => {
    render(<HomeClient resident={null} />);

    expect(screen.getByText('按任意键开始')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '北斗镇记忆菜单' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '按任意键开始' }));

    expect(screen.getByRole('navigation', { name: '北斗镇记忆菜单' })).toHaveClass('transition-all');
    expect(screen.getByRole('link', { name: /新的开始/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: /载入记忆/i })).toHaveAttribute('href', '/login');
    expect(window.sessionStorage.getItem('beidou-home-started-resident')).toBeNull();
  });

  it('skips the intro gate for residents after they have already started in this session', () => {
    window.sessionStorage.setItem('beidou-home-started-resident', '1');

    render(<HomeClient resident={{ id: 'resident-1', name: '阿北', role: 'resident' }} />);

    expect(screen.queryByText('按任意键开始')).not.toBeInTheDocument();
    expect(screen.getByLabelText('缓缓旋转的北斗七星导航')).toBeInTheDocument();
  });

  it('still shows the intro gate for guests even if a resident already started earlier in this session', () => {
    window.sessionStorage.setItem('beidou-home-started-resident', '1');

    render(<HomeClient resident={null} />);

    expect(screen.getByText('按任意键开始')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '北斗镇记忆菜单' })).not.toBeInTheDocument();
  });

  it('opens the resident constellation only after the shared intro gate starts', () => {
    render(<HomeClient resident={{ id: 'resident-1', image: 'https://example.com/avatar.png', name: '阿北', role: 'resident' }} />);

    expect(screen.getByText('按任意键开始')).toBeInTheDocument();
    expect(screen.queryByLabelText('缓缓旋转的北斗七星导航')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '按任意键开始' }));

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
    expect(screen.getByRole('link', { name: '进入阿北的住民档案' })).toHaveAttribute('href', '/resident');
  });

  it('supports keyboard start for the shared intro gate', () => {
    render(<HomeClient resident={{ id: 'resident-1', name: '阿北', role: 'resident' }} />);

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(screen.getByLabelText('缓缓旋转的北斗七星导航')).toBeInTheDocument();
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
      fireEvent.click(screen.getByRole('button', { name: '按任意键开始' }));
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
