import type { TavernMessageDeleteReason, UserRole } from '@prisma/client';

export type TavernResident = {
  id: string;
  name?: string | null;
  role: UserRole;
};

export type TavernMessageView = {
  id: string;
  content: string;
  createdAt: string;
  isDeleted: boolean;
  deleteReason: TavernMessageDeleteReason | null;
  canWithdraw: boolean;
  canModerate: boolean;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    role: UserRole;
  };
};

export type TavernActionResult =
  | { ok: true }
  | { ok: false; error: string };
