import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, pg } from './client';

(async () => {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations applied');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pg.end();
  }
})();
