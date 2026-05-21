import type { UserRole } from '@prisma/client';

export type TreeholeResident = {
  id: string;
  name?: string | null;
  role: UserRole;
};

export type TreeholePostView = {
  id: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  isDeleted: boolean;
  authorLabel: string;
  canWithdraw: boolean;
  canModerate: boolean;
};

export type TreeholeActionResult =
  | { ok: true }
  | { ok: false; error: string };
