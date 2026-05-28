import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import type { TreeholeActionResult, TreeholeMessageView, TreeholePostView, TreeholeReplyView, TreeholeResident } from './types';
import { parseTreeholePostInput, parseTreeholeReplyContent } from './validation';

type TreeholePostWithAuthor = {
  id: string;
  authorId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
  isDeleted: boolean;
  _count?: {
    replies: number;
  };
  replies?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    isAnonymous: boolean;
    author: {
      nickname: string;
    };
  }>;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    role: UserRole;
  };
};

type TreeholeReplyWithPost = {
  id: string;
  content: string;
  createdAt: Date;
  isDeleted: boolean;
  isAnonymous: boolean;
  author: {
    nickname: string;
  };
  post: {
    id: string;
    title: string;
    authorId: string;
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
  _count: {
    select: {
      replies: true,
    },
  },
};

function toPreview(content: string) {
  return content
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export function toTreeholePostView(post: TreeholePostWithAuthor, resident: TreeholeResident | null): TreeholePostView {
  return {
    id: post.id,
    title: post.title,
    preview: toPreview(post.content),
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    isAnonymous: post.isAnonymous,
    isDeleted: post.isDeleted,
    authorLabel: post.isAnonymous ? '匿名居民' : post.author.nickname,
    replyCount: post._count?.replies ?? 0,
    canWithdraw: Boolean(resident && !post.isDeleted && resident.id === post.authorId),
    canModerate: Boolean(resident && !post.isDeleted && resident.role === UserRole.ADMIN),
  };
}

export function toTreeholeReplyView(reply: { id: string; content: string; createdAt: Date; isAnonymous: boolean; author: { nickname: string } }): TreeholeReplyView {
  return {
    id: reply.id,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
    authorLabel: reply.isAnonymous ? '匿名回信' : reply.author.nickname,
  };
}

export async function listRecentTreeholePosts(resident: TreeholeResident | null, take = 24) {
  const posts = await db.treeholePost.findMany({
    where: { isDeleted: false },
    include: treeholePostInclude,
    orderBy: { createdAt: 'desc' },
    take,
  });

  return posts.map((post) => toTreeholePostView(post, resident));
}

export async function listResidentTreeholePosts(resident: TreeholeResident | null, take = 50) {
  if (!resident) {
    return [];
  }

  const posts = await db.treeholePost.findMany({
    where: { authorId: resident.id },
    include: treeholePostInclude,
    orderBy: { createdAt: 'desc' },
    take,
  });

  return posts.map((post) => toTreeholePostView(post, resident));
}

export async function getTreeholePostDetail(resident: TreeholeResident | null, postId: string) {
  const post = await db.treeholePost.findUnique({
    where: { id: postId },
    include: {
      ...treeholePostInclude,
      replies: {
        where: { isDeleted: false },
        include: {
          author: {
            select: {
              nickname: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!post) {
    return null;
  }

  return {
    post: toTreeholePostView(post, resident),
    replies: (post.replies ?? []).map((reply) => toTreeholeReplyView(reply)),
  };
}

export async function listResidentTreeholeMessages(resident: TreeholeResident | null, take = 50): Promise<TreeholeMessageView[]> {
  if (!resident) {
    return [];
  }

  const replies = await db.treeholeReply.findMany({
    where: {
      isDeleted: false,
      post: {
        authorId: resident.id,
      },
    },
    include: {
      author: {
        select: {
          nickname: true,
        },
      },
      post: {
        select: {
          id: true,
          title: true,
          authorId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return replies.map((reply: TreeholeReplyWithPost) => ({
    id: reply.id,
    postId: reply.post.id,
    postTitle: reply.post.title,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
    authorLabel: reply.isAnonymous ? '匿名回信' : reply.author.nickname,
  }));
}

export async function createTreeholePost(
  resident: TreeholeResident | null,
  titleInput: string,
  contentInput: string,
): Promise<TreeholeActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录再投递。' };
  }

  const parsed = parseTreeholePostInput(titleInput, contentInput);

  if (!parsed.ok) {
    return parsed;
  }

  await db.treeholePost.create({
    data: {
      authorId: resident.id,
      title: parsed.title,
      content: parsed.content,
      isAnonymous: true,
    },
  });

  return { ok: true };
}

export async function createTreeholeReply(
  resident: TreeholeResident | null,
  postId: string,
  input: string,
): Promise<TreeholeActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录再回信。' };
  }

  const parsed = parseTreeholeReplyContent(input);
  if (!parsed.ok) {
    return parsed;
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

  await db.treeholeReply.create({
    data: {
      postId: post.id,
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
