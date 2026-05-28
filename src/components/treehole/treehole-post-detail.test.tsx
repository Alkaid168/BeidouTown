import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TreeholePostDetail } from './treehole-post-detail';

vi.mock('@/components/tavern/markdown-message', () => ({
  MarkdownMessage: ({ content }: { content: string }) => <div>{content}</div>,
}));

vi.mock('@/components/tavern/tavern-context-menu', () => ({
  TavernContextMenu: () => null,
}));

vi.mock('@/features/treehole/actions', () => ({
  publishTreeholeReplyAction: vi.fn(),
  withdrawTreeholePostAction: vi.fn(),
}));

describe('TreeholePostDetail', () => {
  const post = {
    id: 'post-1',
    title: '测试',
    preview: '预览',
    content: '正文内容',
    createdAt: '2026-05-23T12:25:46.000Z',
    isAnonymous: true,
    isDeleted: false,
    authorLabel: '匿名居民',
    replyCount: 1,
    canWithdraw: true,
    canModerate: false,
  };

  it('renders replies in the same scroll flow as the letter content', () => {
    const { container } = render(
      <TreeholePostDetail
        post={post}
        replies={[
          {
            id: 'reply-1',
            content: '第一条回信',
            createdAt: '2026-05-23T12:26:46.000Z',
            authorLabel: '另一位匿名居民',
          },
        ]}
        resident={{ id: 'resident-1', name: '阿北', role: 'resident' as never }}
      />,
    );

    expect(screen.getByText('第一条回信')).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('min-h-[72vh]');
    expect(container.innerHTML).not.toContain('min-h-[16rem]');
  });
});
