import { TavernMessageDeleteReason, UserRole } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTavernMessage, moderateTavernMessage, withdrawTavernMessage } from './messages';

const { messageCreate, messageFindFirst, messageFindUnique, messageUpdate } = vi.hoisted(() => ({
  messageCreate: vi.fn(),
  messageFindFirst: vi.fn(),
  messageFindUnique: vi.fn(),
  messageUpdate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    tavernMessage: {
      create: messageCreate,
      findFirst: messageFindFirst,
      findUnique: messageFindUnique,
      update: messageUpdate,
    },
  },
}));

const resident = { id: 'user_1', role: UserRole.USER, name: 'Alice' };
const admin = { id: 'admin_1', role: UserRole.ADMIN, name: '镇长' };

describe('tavern message services', () => {
  beforeEach(() => {
    messageCreate.mockReset();
    messageFindFirst.mockReset();
    messageFindUnique.mockReset();
    messageUpdate.mockReset();
  });

  it('rejects guest sending', async () => {
    await expect(createTavernMessage(null, 'hello')).resolves.toEqual({ ok: false, error: '请先登录再发言。' });
  });

  it('rejects invalid content', async () => {
    await expect(createTavernMessage(resident, '   ')).resolves.toEqual({ ok: false, error: '不能发送空消息。' });
  });

  it('rejects messages sent too quickly', async () => {
    messageFindFirst.mockResolvedValue({ createdAt: new Date() });
    await expect(createTavernMessage(resident, 'hello')).resolves.toEqual({ ok: false, error: '先喝口茶，稍后再说。' });
    expect(messageCreate).not.toHaveBeenCalled();
  });

  it('creates a valid message', async () => {
    messageFindFirst.mockResolvedValue(null);
    messageCreate.mockResolvedValue({ id: 'msg_1' });
    await expect(createTavernMessage(resident, ' hello ')).resolves.toEqual({ ok: true });
    expect(messageCreate).toHaveBeenCalledWith({ data: { authorId: 'user_1', content: 'hello' } });
  });

  it('allows owner to withdraw message', async () => {
    messageFindUnique.mockResolvedValue({ id: 'msg_1', authorId: 'user_1', isDeleted: false });
    await expect(withdrawTavernMessage(resident, 'msg_1')).resolves.toEqual({ ok: true });
    expect(messageUpdate).toHaveBeenCalledWith({
      where: { id: 'msg_1' },
      data: expect.objectContaining({
        isDeleted: true,
        deletedById: 'user_1',
        deleteReason: TavernMessageDeleteReason.WITHDRAWN,
      }),
    });
  });

  it('rejects non-owner withdrawal', async () => {
    messageFindUnique.mockResolvedValue({ id: 'msg_1', authorId: 'other', isDeleted: false });
    await expect(withdrawTavernMessage(resident, 'msg_1')).resolves.toEqual({ ok: false, error: '只能撤回自己的消息。' });
  });

  it('allows admin moderation', async () => {
    messageFindUnique.mockResolvedValue({ id: 'msg_1', authorId: 'user_1', isDeleted: false });
    await expect(moderateTavernMessage(admin, 'msg_1')).resolves.toEqual({ ok: true });
    expect(messageUpdate).toHaveBeenCalledWith({
      where: { id: 'msg_1' },
      data: expect.objectContaining({
        isDeleted: true,
        deletedById: 'admin_1',
        deleteReason: TavernMessageDeleteReason.MODERATED,
      }),
    });
  });
});
