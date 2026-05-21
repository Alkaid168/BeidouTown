import { UserRole } from '@prisma/client';
import { db } from '../src/lib/db';
import { hashPassword } from '../src/features/residents/password';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@beidou.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'beidou-admin-123456';
  const nickname = process.env.SEED_ADMIN_NICKNAME ?? '镇长';

  await db.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: await hashPassword(password),
      nickname,
      role: UserRole.ADMIN,
    },
    update: {
      nickname,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Seeded admin resident: ${email}`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
