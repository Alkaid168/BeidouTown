import { cleanupTavernMessages } from '../src/features/tavern/cleanup';
import { db } from '../src/lib/db';

cleanupTavernMessages()
  .then(async (result) => {
    console.log(JSON.stringify(result));
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
