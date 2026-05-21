import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupTavernMessages, getTavernCleanupPlan } from './cleanup';

const { messageCount, messageDeleteMany, messageFindMany } = vi.hoisted(() => ({
  messageCount: vi.fn(),
  messageDeleteMany: vi.fn(),
  messageFindMany: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    tavernMessage: {
      count: messageCount,
      deleteMany: messageDeleteMany,
      findMany: messageFindMany,
    },
  },
}));

describe('getTavernCleanupPlan', () => {
  it('uses a 30 day cutoff and calculates excess count', () => {
    const plan = getTavernCleanupPlan({
      totalMessages: 160_010,
      now: new Date('2026-05-31T00:00:00Z'),
    });

    expect(plan.deleteBefore).toEqual(new Date('2026-05-01T00:00:00Z'));
    expect(plan.excessCount).toBe(10);
  });
});

describe('cleanupTavernMessages', () => {
  beforeEach(() => {
    messageCount.mockReset();
    messageDeleteMany.mockReset();
    messageFindMany.mockReset();
  });

  it('deletes old messages and oldest excess messages', async () => {
    messageCount.mockResolvedValue(160_002);
    messageFindMany.mockResolvedValue([{ id: 'old_1' }, { id: 'old_2' }]);
    messageDeleteMany.mockResolvedValueOnce({ count: 3 }).mockResolvedValueOnce({ count: 2 });

    await expect(cleanupTavernMessages(new Date('2026-05-31T00:00:00Z'))).resolves.toEqual({
      deletedOldMessages: 3,
      deletedExcessMessages: 2,
    });

    expect(messageDeleteMany).toHaveBeenNthCalledWith(1, {
      where: {
        createdAt: {
          lt: new Date('2026-05-01T00:00:00Z'),
        },
      },
    });
    expect(messageFindMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
      take: 2,
    });
    expect(messageDeleteMany).toHaveBeenNthCalledWith(2, {
      where: {
        id: {
          in: ['old_1', 'old_2'],
        },
      },
    });
  });
});
