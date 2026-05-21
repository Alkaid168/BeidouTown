import { TavernMessageDeleteReason, UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { canSendTavernMessage } from './rate-limit';
import type { TavernActionResult, TavernMessageView, TavernResident } from './types';
import { parseTavernMessageContent } from './validation';

type TavernMessageWithAuthor = {
  id: string;
  content: string;
  createdAt: Date;
  isDeleted: boolean;
  deleteReason: TavernMessageDeleteReason | null;
  authorId: string;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    role: UserRole;
  };
};

const tavernMessageInclude = {
  author: {
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      role: true,
    },
  },
};

export function toTavernMessageView(
  message: TavernMessageWithAuthor,
  resident: TavernResident | null,
): TavernMessageView {
  return {
    id: message.id,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    isDeleted: message.isDeleted,
    deleteReason: message.deleteReason,
    canWithdraw: Boolean(resident && !message.isDeleted && resident.id === message.authorId),
    canModerate: Boolean(resident && !message.isDeleted && resident.role === UserRole.ADMIN),
    author: message.author,
  };
}

export async function listRecentTavernMessages(resident: TavernResident | null, take = 50) {
  const messages = await db.tavernMessage.findMany({
    include: tavernMessageInclude,
    orderBy: { createdAt: 'desc' },
    take,
  });

  return messages.reverse().map((message) => toTavernMessageView(message, resident));
}

export async function listTavernMessagesAfter(after: Date, resident: TavernResident | null) {
  const messages = await db.tavernMessage.findMany({
    include: tavernMessageInclude,
    orderBy: { createdAt: 'asc' },
    where: {
      createdAt: {
        gt: after,
      },
    },
    take: 100,
  });

  return messages.map((message) => toTavernMessageView(message, resident));
}

export async function createTavernMessage(
  resident: TavernResident | null,
  input: string,
): Promise<TavernActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录再发言。' };
  }

  const parsed = parseTavernMessageContent(input);

  if (!parsed.ok) {
    return parsed;
  }

  const lastMessage = await db.tavernMessage.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
    where: { authorId: resident.id },
  });

  if (!canSendTavernMessage(lastMessage?.createdAt ?? null)) {
    return { ok: false, error: '先喝口茶，稍后再说。' };
  }

  await db.tavernMessage.create({
    data: {
      authorId: resident.id,
      content: parsed.content,
    },
  });

  return { ok: true };
}

export async function withdrawTavernMessage(
  resident: TavernResident | null,
  messageId: string,
): Promise<TavernActionResult> {
  if (!resident) {
    return { ok: false, error: '请先登录。' };
  }

  const message = await db.tavernMessage.findUnique({
    select: {
      id: true,
      authorId: true,
      isDeleted: true,
    },
    where: { id: messageId },
  });

  if (!message || message.isDeleted) {
    return { ok: false, error: '这条消息不存在。' };
  }

  if (message.authorId !== resident.id) {
    return { ok: false, error: '只能撤回自己的消息。' };
  }

  await db.tavernMessage.update({
    where: { id: message.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: resident.id,
      deleteReason: TavernMessageDeleteReason.WITHDRAWN,
    },
  });

  return { ok: true };
}

export async function moderateTavernMessage(
  resident: TavernResident | null,
  messageId: string,
): Promise<TavernActionResult> {
  if (!resident || resident.role !== UserRole.ADMIN) {
    return { ok: false, error: '没有管理权限。' };
  }

  const message = await db.tavernMessage.findUnique({
    select: {
      id: true,
      authorId: true,
      isDeleted: true,
    },
    where: { id: messageId },
  });

  if (!message || message.isDeleted) {
    return { ok: false, error: '这条消息不存在。' };
  }

  await db.tavernMessage.update({
    where: { id: message.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedById: resident.id,
      deleteReason: TavernMessageDeleteReason.MODERATED,
    },
  });

  return { ok: true };
}
