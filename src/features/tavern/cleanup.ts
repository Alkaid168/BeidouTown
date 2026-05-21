import { db } from '@/lib/db';

const TAVERN_RETENTION_DAYS = 30;
const TAVERN_MAX_MESSAGES = 160_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function getTavernCleanupPlan({
  now = new Date(),
  totalMessages,
}: {
  now?: Date;
  totalMessages: number;
}) {
  return {
    deleteBefore: new Date(now.getTime() - TAVERN_RETENTION_DAYS * MS_PER_DAY),
    excessCount: Math.max(0, totalMessages - TAVERN_MAX_MESSAGES),
  };
}

export async function cleanupTavernMessages(now = new Date()) {
  const totalMessages = await db.tavernMessage.count();
  const plan = getTavernCleanupPlan({ now, totalMessages });

  const oldMessages = await db.tavernMessage.deleteMany({
    where: {
      createdAt: {
        lt: plan.deleteBefore,
      },
    },
  });

  let deletedExcessMessages = 0;

  if (plan.excessCount > 0) {
    const excessMessages = await db.tavernMessage.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
      take: plan.excessCount,
    });

    if (excessMessages.length > 0) {
      const result = await db.tavernMessage.deleteMany({
        where: {
          id: {
            in: excessMessages.map((message) => message.id),
          },
        },
      });
      deletedExcessMessages = result.count;
    }
  }

  return {
    deletedOldMessages: oldMessages.count,
    deletedExcessMessages,
  };
}
