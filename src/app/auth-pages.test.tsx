import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/residents/actions', () => ({
  loginResidentAction: vi.fn(),
  registerResidentAction: vi.fn(),
}));

describe('auth pages', () => {
  it('renders the login page as a memory gate', async () => {
    const { default: LoginPage } = await import('./login/page');

    render(await LoginPage({ searchParams: Promise.resolve({ registered: '1' }) }));

    expect(screen.getByText('载入记忆')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass("bg-[url('/auth-background.png')]");
    expect(screen.getByRole('button', { name: '进入小镇' })).toBeInTheDocument();
    expect(screen.getByText('注册成功，请登录。')).toBeInTheDocument();
  });

  it('renders the register page as a new beginning gate', async () => {
    const { default: RegisterPage } = await import('./register/page');

    render(await RegisterPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText('新的开始')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass("bg-[url('/auth-background.png')]");
    expect(screen.getByRole('button', { name: '写入星名' })).toBeInTheDocument();
    expect(screen.getByText(/领取一枚属于你的北斗镇星标/)).toBeInTheDocument();
  });
});
