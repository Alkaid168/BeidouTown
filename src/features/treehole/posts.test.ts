import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTreeholePost,
  createTreeholeReply,
  getTreeholePostDetail,
  listResidentTreeholeMessages,
  listResidentTreeholePosts,
  listRecentTreeholePosts,
  moderateTreeholePost,
  toTreeholePostView,
  withdrawTreeholePost,
} from './posts';

const { postCreate, postFindUnique, postFindMany, postUpdate, replyCreate, replyFindMany } = vi.hoisted(() => ({
  postCreate: vi.fn(),
  postFindUnique: vi.fn(),
  postFindMany: vi.fn(),
  postUpdate: vi.fn(),
  replyCreate: vi.fn(),
  replyFindMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    treeholePost: {
      create: postCreate,
      findUnique: postFindUnique,
      findMany: postFindMany,
      update: postUpdate,
    },
    treeholeReply: {
      create: replyCreate,
      findMany: replyFindMany,
    },
  },
}));

const resident = { id: 'user_1', role: UserRole.USER, name: 'Alice' };
const residentTwo = { id: 'user_2', role: UserRole.USER, name: 'Bob' };
const admin = { id: 'admin_1', role: UserRole.ADMIN, name: '镇长' };

const post = {
  id: 'post_1',
  authorId: 'user_1',
  title: '今晚的风',
  content: '晚安，北斗镇。',
  createdAt: new Date('2026-05-21T12:00:00.000Z'),
  updatedAt: new Date('2026-05-21T12:00:00.000Z'),
  isAnonymous: true,
  isDeleted: false,
  _count: { replies: 2 },
  author: {
    id: 'user_1',
    nickname: 'Alice',
    avatarUrl: null,
    role: UserRole.USER,
  },
};

describe('treehole post services', () => {
  beforeEach(() => {
    postCreate.mockReset();
    postFindUnique.mockReset();
    postFindMany.mockReset();
    postUpdate.mockReset();
    replyCreate.mockReset();
    replyFindMany.mockReset();
  });

  it('rejects guest publishing', async () => {
    await expect(createTreeholePost(null, '标题', 'hello')).resolves.toEqual({ ok: false, error: '请先登录再投递。' });
  });

  it('rejects invalid post input', async () => {
    await expect(createTreeholePost(resident, '   ', '   ')).resolves.toEqual({ ok: false, error: '不能投递空白信件。' });
    expect(postCreate).not.toHaveBeenCalled();
  });

  it('defaults blank post title to 无题 for logged-in resident', async () => {
    postCreate.mockResolvedValue({ id: 'post_1' });

    await expect(createTreeholePost(resident, '   ', ' world ')).resolves.toEqual({ ok: true });
    expect(postCreate).toHaveBeenCalledWith({
      data: {
        authorId: 'user_1',
        title: '无题',
        content: 'world',
        isAnonymous: true,
      },
    });
  });

  it('maps anonymous post views with title preview and reply count', () => {
    expect(toTreeholePostView(post, resident)).toEqual({
      id: 'post_1',
      title: '今晚的风',
      preview: '晚安，北斗镇。',
      content: '晚安，北斗镇。',
      createdAt: '2026-05-21T12:00:00.000Z',
      isAnonymous: true,
      isDeleted: false,
      authorLabel: '匿名居民',
      replyCount: 2,
      canWithdraw: true,
      canModerate: false,
    });
  });

  it('lists recent posts in descending order', async () => {
    postFindMany.mockResolvedValue([post]);

    await expect(listRecentTreeholePosts(resident)).resolves.toEqual([
      expect.objectContaining({ id: 'post_1', title: '今晚的风', replyCount: 2 }),
    ]);
    expect(postFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 24 }));
  });

  it('lists only current resident posts for mine page', async () => {
    postFindMany.mockResolvedValue([post]);

    await expect(listResidentTreeholePosts(resident)).resolves.toEqual([
      expect.objectContaining({ id: 'post_1', canWithdraw: true }),
    ]);
    expect(postFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { authorId: 'user_1' }, orderBy: { createdAt: 'desc' }, take: 50 }));
  });

  it('returns empty mine page list for guests', async () => {
    await expect(listResidentTreeholePosts(null)).resolves.toEqual([]);
    expect(postFindMany).not.toHaveBeenCalled();
  });

  it('returns detail with replies for a post', async () => {
    postFindUnique.mockResolvedValue({
      ...post,
      replies: [
        {
          id: 'reply_1',
          content: '愿你今晚好梦。',
          createdAt: new Date('2026-05-22T10:00:00.000Z'),
          isAnonymous: true,
          author: { nickname: 'Bob' },
        },
      ],
    });

    await expect(getTreeholePostDetail(resident, 'post_1')).resolves.toEqual({
      post: expect.objectContaining({ id: 'post_1', title: '今晚的风' }),
      replies: [
        {
          id: 'reply_1',
          content: '愿你今晚好梦。',
          createdAt: '2026-05-22T10:00:00.000Z',
          authorLabel: '匿名回信',
        },
      ],
    });
  });

  it('creates anonymous reply on an existing post', async () => {
    postFindUnique.mockResolvedValue({ id: 'post_1', isDeleted: false, authorId: 'user_1' });
    replyCreate.mockResolvedValue({ id: 'reply_1' });

    await expect(createTreeholeReply(residentTwo, 'post_1', '  愿你今晚好梦。  ')).resolves.toEqual({ ok: true });
    expect(replyCreate).toHaveBeenCalledWith({
      data: {
        postId: 'post_1',
        authorId: 'user_2',
        content: '愿你今晚好梦。',
        isAnonymous: true,
      },
    });
  });

  it('rejects reply when guest is not logged in', async () => {
    await expect(createTreeholeReply(null, 'post_1', 'hello')).resolves.toEqual({ ok: false, error: '请先登录再回信。' });
  });

  it('rejects reply to missing post', async () => {
    postFindUnique.mockResolvedValue(null);

    await expect(createTreeholeReply(residentTwo, 'post_1', 'hello')).resolves.toEqual({ ok: false, error: '这封信不存在。' });
    expect(replyCreate).not.toHaveBeenCalled();
  });

  it('lists resident reply notifications from replies on owned posts', async () => {
    replyFindMany.mockResolvedValue([
      {
        id: 'reply_1',
        content: '我也有过这样的夜晚。',
        createdAt: new Date('2026-05-22T10:00:00.000Z'),
        isDeleted: false,
        isAnonymous: true,
        author: { nickname: 'Bob' },
        post: { id: 'post_1', title: '今晚的风', authorId: 'user_1' },
      },
    ]);

    await expect(listResidentTreeholeMessages(resident)).resolves.toEqual([
      {
        id: 'reply_1',
        postId: 'post_1',
        postTitle: '今晚的风',
        content: '我也有过这样的夜晚。',
        createdAt: '2026-05-22T10:00:00.000Z',
        authorLabel: '匿名回信',
      },
    ]);
    expect(replyFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { post: { authorId: 'user_1' }, isDeleted: false }, orderBy: { createdAt: 'desc' }, take: 50 }));
  });

  it('returns empty messages for guests', async () => {
    await expect(listResidentTreeholeMessages(null)).resolves.toEqual([]);
    expect(replyFindMany).not.toHaveBeenCalled();
  });

  it('allows owner to withdraw post', async () => {
    postFindUnique.mockResolvedValue({ id: 'post_1', authorId: 'user_1', isDeleted: false });

    await expect(withdrawTreeholePost(resident, 'post_1')).resolves.toEqual({ ok: true });
    expect(postUpdate).toHaveBeenCalledWith({
      where: { id: 'post_1' },
      data: { isDeleted: true },
    });
  });

  it('rejects non-owner withdrawal', async () => {
    postFindUnique.mockResolvedValue({ id: 'post_1', authorId: 'other', isDeleted: false });

    await expect(withdrawTreeholePost(resident, 'post_1')).resolves.toEqual({ ok: false, error: '只能收回自己的信。' });
  });

  it('rejects guest withdrawal', async () => {
    await expect(withdrawTreeholePost(null, 'post_1')).resolves.toEqual({ ok: false, error: '请先登录。' });
  });

  it('allows admin moderation', async () => {
    postFindUnique.mockResolvedValue({ id: 'post_1', authorId: 'user_1', isDeleted: false });

    await expect(moderateTreeholePost(admin, 'post_1')).resolves.toEqual({ ok: true });
    expect(postUpdate).toHaveBeenCalledWith({
      where: { id: 'post_1' },
      data: { isDeleted: true },
    });
  });

  it('rejects non-admin moderation', async () => {
    await expect(moderateTreeholePost(resident, 'post_1')).resolves.toEqual({ ok: false, error: '没有管理权限。' });
  });

  it('rejects missing or deleted posts', async () => {
    postFindUnique.mockResolvedValue({ id: 'post_1', authorId: 'user_1', isDeleted: true });

    await expect(withdrawTreeholePost(resident, 'post_1')).resolves.toEqual({ ok: false, error: '这封信不存在。' });
    await expect(moderateTreeholePost(admin, 'post_1')).resolves.toEqual({ ok: false, error: '这封信不存在。' });
  });
});
