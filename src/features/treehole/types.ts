import type { UserRole } from '@prisma/client';

export type TreeholeResident = {
  id: string;
  name?: string | null;
  role: UserRole;
};

export type TreeholePostView = {
  id: string;
  title: string;
  preview: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  isDeleted: boolean;
  authorLabel: string;
  replyCount: number;
  canWithdraw: boolean;
  canModerate: boolean;
};

export type TreeholeReplyView = {
  id: string;
  content: string;
  createdAt: string;
  authorLabel: string;
};

export type TreeholeMessageView = {
  id: string;
  postId: string;
  postTitle: string;
  content: string;
  createdAt: string;
  authorLabel: string;
};

export type TreeholeActionResult =
  | { ok: true }
  | { ok: false; error: string };
