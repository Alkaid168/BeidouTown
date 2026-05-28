const { PrismaClient } = require('@prisma/client');

async function main() {
  const db = new PrismaClient();
  try {
    const lockRows = await db.$queryRawUnsafe(`
      SELECT a.pid, a.usename, a.application_name, a.state, a.query
      FROM pg_locks l
      JOIN pg_stat_activity a ON a.pid = l.pid
      WHERE l.locktype = 'advisory' AND l.classid = 0 AND l.objid = 72707369
    `);
    console.log(JSON.stringify(lockRows, null, 2));

    for (const row of lockRows) {
      await db.$queryRawUnsafe(`SELECT pg_terminate_backend(${Number(row.pid)})`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
