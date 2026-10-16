import { db, pg } from '@/db/client';
import { links } from '@/db/schema';

export async function resetLinks() {
  await db.delete(links);
}

export async function closeDb() {
  await pg.end();
}
