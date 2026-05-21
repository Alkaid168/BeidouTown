import { UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createTreeholePost,
  moderateTreeholePost,
  toTreeholePostView,
  withdrawTreeholePost,
} from './posts';

const { postCreate, postFindUnique, postUpdate } = vi.hoisted(() => ({
  postCreate: vi.fn(),
  postFindUnique: vi.fn(),
  postUpdate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    treeholePost: {
      create: postCreate,
      findUnique: postFindUnique,
      update: postUpdate,
    },
  },
}));

const resident = { id: 'user_1', role: UserRole.USER, name: 'Alice' };
const admin = { id: 'admin_1', role: UserRole.ADMIN, name: '镇长' };

const post = {
  id: 'post_1',
  authorId: 'user_1',
  content: '晚安，北斗镇。',
  createdAt: new Date('2026-05-21T12:00:00.000Z'),
  isAnonymous: true,
  isDeleted: false,
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
    postUpdate.mockReset();
  });

  it('rejects guest publishing', async () => {
    await expect(createTreeholePost(null, 'hello')).resolves.toEqual({ ok: false, error: '请先登录再投递。' });
  });

  it('rejects invalid content', async () => {
    await expect(createTreeholePost(resident, '   ')).resolves.toEqual({ ok: false, error: '不能投递空白信件。' });
    expect(postCreate).not.toHaveBeenCalled();
  });

  it('creates anonymous post for logged-in resident', async () => {
    postCreate.mockResolvedValue({ id: 'post_1' });

    await expect(createTreeholePost(resident, ' hello ')).resolves.toEqual({ ok: true });
    expect(postCreate).toHaveBeenCalledWith({
      data: {
        authorId: 'user_1',
        content: 'hello',
        isAnonymous: true,
      },
    });
  });

  it('maps anonymous post views without exposing author identity', () => {
    expect(toTreeholePostView(post, resident)).toEqual({
      id: 'post_1',
      content: '晚安，北斗镇。',
      createdAt: '2026-05-21T12:00:00.000Z',
      isAnonymous: true,
      isDeleted: false,
      authorLabel: '匿名居民',
      canWithdraw: true,
      canModerate: false,
    });
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
