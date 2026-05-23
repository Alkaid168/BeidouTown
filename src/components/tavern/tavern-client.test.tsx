import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TavernClient } from './tavern-client';

vi.mock('@/features/tavern/actions', () => ({
  moderateTavernMessageAction: vi.fn(),
  sendTavernMessageAction: vi.fn(),
  withdrawTavernMessageAction: vi.fn(),
}));

function mockFetch(messages = []) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ messages }),
  } as Response);
}

describe('TavernClient', () => {
  it('renders the chat page inside a dedicated scroll shell instead of a full-page flow', () => {
    mockFetch();
    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    expect(screen.getByTestId('tavern-shell')).toBeInTheDocument();
    expect(screen.getByTestId('tavern-messages-scroll')).toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('tavern-composer')).toHaveClass('absolute');
  });

  it('uses the shorter placeholder and removes the identity helper copy', () => {
    mockFetch();
    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    expect(screen.getAllByPlaceholderText('说点什么...')).toHaveLength(2);
    expect(screen.queryByText(/最多 500 字/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/以 .* 的身份发言/i)).not.toBeInTheDocument();
  });

  it('renders a stable square avatar with the nickname initial and warm tavern sizing', () => {
    mockFetch();
    render(
      <TavernClient
        initialMessages={[
          {
            id: 'msg-1',
            content: '今晚有风。',
            createdAt: '2026-05-21T20:00:00.000Z',
            isDeleted: false,
            deleteReason: null,
            canWithdraw: false,
            canModerate: false,
            author: { id: 'a1', nickname: '默弥', avatarUrl: null, role: 'resident' },
          },
        ]}
        resident={null}
      />,
    );

    const avatar = screen.getByLabelText('默弥 的头像');
    expect(avatar).toHaveTextContent('默');
    expect(avatar).toHaveClass('aspect-square');
    expect(avatar).toHaveClass('size-12');
    expect(avatar).toHaveClass('text-xl');
  });

  it('hides nickname by default and reveals nickname with time on hover', async () => {
    mockFetch();
    const user = userEvent.setup();
    render(
      <TavernClient
        initialMessages={[
          {
            id: 'msg-1',
            content: '今晚有风。',
            createdAt: '2026-05-21T20:00:00.000Z',
            isDeleted: false,
            deleteReason: null,
            canWithdraw: false,
            canModerate: false,
            author: { id: 'a1', nickname: '默弥', avatarUrl: null, role: 'resident' },
          },
        ]}
        resident={null}
      />,
    );

    const meta = screen.getByTestId('message-meta-msg-1');
    expect(meta).toHaveClass('opacity-0');

    await user.hover(screen.getByText('今晚有风。'));
    expect(meta).toHaveClass('group-hover:opacity-100');
    expect(screen.getByText('2026-05-21 20:00')).toBeInTheDocument();
  });

  it('opens a right-click menu with withdraw for the resident own message', async () => {
    mockFetch();
    const user = userEvent.setup();

    render(
      <TavernClient
        initialMessages={[
          {
            id: 'msg-1',
            content: '测试消息',
            createdAt: '2026-05-21T20:00:00.000Z',
            isDeleted: false,
            deleteReason: null,
            canWithdraw: true,
            canModerate: false,
            author: { id: 'a1', nickname: '阿北', avatarUrl: null, role: 'resident' },
          },
        ]}
        resident={{ id: 'a1', name: '阿北', role: 'resident' }}
      />,
    );

    await user.pointer({ target: screen.getByText('测试消息'), keys: '[MouseRight]' });
    expect(screen.getByRole('menuitem', { name: '撤回' })).toBeInTheDocument();
  });

  it('renders deleted messages with the subdued tavern bubble treatment', () => {
    mockFetch();
    render(
      <TavernClient
        initialMessages={[
          {
            id: 'msg-1',
            content: '原内容',
            createdAt: '2026-05-21T20:00:00.000Z',
            isDeleted: true,
            deleteReason: 'withdrawn',
            canWithdraw: false,
            canModerate: false,
            author: { id: 'a1', nickname: '旅人甲', avatarUrl: null, role: 'resident' },
          },
        ]}
        resident={null}
      />,
    );

    expect(screen.getByText('这条消息已经离开了酒馆。')).toHaveClass('text-sm');
  });

  it('opens long-text mode as an upward overlay instead of growing normal layout height', async () => {
    mockFetch();
    const user = userEvent.setup();
    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    await user.click(screen.getByRole('button', { name: '展开长文本' }));
    expect(screen.getByTestId('tavern-composer-overlay')).toHaveAttribute('data-state', 'open');
    expect(screen.getByTestId('tavern-composer-overlay')).toHaveClass('absolute');
  });

  it('closes the context menu on Escape and on scroll', async () => {
    mockFetch();
    const user = userEvent.setup();

    render(
      <TavernClient
        initialMessages={[
          {
            id: 'msg-1',
            content: '测试消息',
            createdAt: '2026-05-21T20:00:00.000Z',
            isDeleted: false,
            deleteReason: null,
            canWithdraw: true,
            canModerate: false,
            author: { id: 'a1', nickname: '阿北', avatarUrl: null, role: 'resident' },
          },
        ]}
        resident={{ id: 'a1', name: '阿北', role: 'resident' }}
      />,
    );

    await user.pointer({ target: screen.getByText('测试消息'), keys: '[MouseRight]' });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.pointer({ target: screen.getByText('测试消息'), keys: '[MouseRight]' });
    fireEvent.scroll(screen.getByTestId('tavern-messages-scroll'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('submits on Enter and keeps Ctrl+Enter for newline', async () => {
    const user = userEvent.setup();
    mockFetch();
    const { sendTavernMessageAction } = await import('@/features/tavern/actions');
    vi.mocked(sendTavernMessageAction).mockResolvedValue({ ok: true });

    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    const composer = screen.getAllByPlaceholderText('说点什么...')[1];
    await user.type(composer, '你好');
    await user.keyboard('{Enter}');

    await waitFor(() => expect(sendTavernMessageAction).toHaveBeenCalledTimes(1));

    await user.clear(composer);
    await user.type(composer, '第二行');
    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(composer).toHaveValue('第二行\n');
  });

  it('auto-scrolls to the latest message after sending succeeds', async () => {
    const user = userEvent.setup();
    mockFetch([
      {
        id: 'msg-2',
        content: '新消息',
        createdAt: '2026-05-21T20:01:00.000Z',
        isDeleted: false,
        deleteReason: null,
        canWithdraw: true,
        canModerate: false,
        author: { id: 'a1', nickname: '阿北', avatarUrl: null, role: 'resident' },
      },
    ]);
    const { sendTavernMessageAction } = await import('@/features/tavern/actions');
    vi.mocked(sendTavernMessageAction).mockResolvedValue({ ok: true });
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });

    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    await user.type(screen.getAllByPlaceholderText('说点什么...')[1], '新消息');
    await user.click(screen.getByRole('button', { name: '发送' }));

    await waitFor(() => expect(scrollTo).toHaveBeenCalled());
  });

  it('shows a fading toast-style notice for action errors', async () => {
    const user = userEvent.setup();
    mockFetch();
    const { sendTavernMessageAction } = await import('@/features/tavern/actions');
    vi.mocked(sendTavernMessageAction).mockResolvedValue({ ok: false, error: '请稍后再试' });

    render(<TavernClient initialMessages={[]} resident={{ id: 'r1', name: '阿北', role: 'resident' }} />);

    await user.type(screen.getAllByPlaceholderText('说点什么...')[1], '测试');
    await user.click(screen.getByRole('button', { name: '发送' }));

    expect(screen.getByText('先喝口茶，稍后再说。')).toBeInTheDocument();
  });

  it('renders a guest prompt when not logged in', () => {
    mockFetch();
    render(<TavernClient initialMessages={[]} resident={null} />);

    expect(screen.getByText('游客可以旁听。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '登录后发言' })).toHaveAttribute('href', '/login');
  });
});
