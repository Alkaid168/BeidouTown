import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import type { TreeholeActionResult, TreeholePostView, TreeholeResident } from './types';
import { parseTreeholePostContent } from './validation';

type TreeholePostWithAuthor = {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  isAnonymous: boolean;
  isDeleted: boolean;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    role: UserRole;
  };
};

const treeholePostInclude = {
  author: {
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      role: true,
    },
  },
};

export function toTreeholePostView(
  post: TreeholePostWithAuthor,
  resident: TreeholeResident | null,
): TreeholePostView {
  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    isAnonymous: post.isAnonymous,
    isDeleted: post.isDeleted,
    authorLabel: post.isAnonymous ? '匿名居民' : post.author.nickname,
    canWithdraw: Boolean(resident && !post.isDeleted && resident.id === post.authorId),
    canModerate: Boolean(resident && !post.isDeleted && resident.role === UserRole.ADMIN),
  };
}

export async function listRecentTreeholePosts(resident: TreeholeResident | null, take = 50) {
  const posts = await db.treeholePost.findMany({
    include: treeholePostInclude,
    orderBy: { createdAt: 'desc' },
    take,
  });

  return posts.map((post) => toTreeholePostView(post, resident));
}

export async function createTreeholePost(
  resident: TreeholeResident | null,
  input: string,
): Promise<TreeholeActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录再投递。' };
  }

  const parsed = parseTreeholePostContent(input);

  if (!parsed.ok) {
    return parsed;
  }

  await db.treeholePost.create({
    data: {
      authorId: resident.id,
      content: parsed.content,
      isAnonymous: true,
    },
  });

  return { ok: true };
}

export async function withdrawTreeholePost(
  resident: TreeholeResident | null,
  postId: string,
): Promise<TreeholeActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录。' };
  }

  const post = await db.treeholePost.findUnique({
    select: {
      id: true,
      authorId: true,
      isDeleted: true,
    },
    where: { id: postId },
  });

  if (!post || post.isDeleted) {
    return { ok: false, error: '这封信不存在。' };
  }

  if (post.authorId !== resident.id) {
    return { ok: false, error: '只能收回自己的信。' };
  }

  await db.treeholePost.update({
    where: { id: post.id },
    data: { isDeleted: true },
  });

  return { ok: true };
}

export async function moderateTreeholePost(
  resident: TreeholeResident | null,
  postId: string,
): Promise<TreeholeActionResult> {
  if (!resident || resident.role !== UserRole.ADMIN) {
    return { ok: false, error: '没有管理权限。' };
  }

  const post = await db.treeholePost.findUnique({
    select: {
      id: true,
      authorId: true,
      isDeleted: true,
    },
    where: { id: postId },
  });

  if (!post || post.isDeleted) {
    return { ok: false, error: '这封信不存在。' };
  }

  await db.treeholePost.update({
    where: { id: post.id },
    data: { isDeleted: true },
  });

  return { ok: true };
}
