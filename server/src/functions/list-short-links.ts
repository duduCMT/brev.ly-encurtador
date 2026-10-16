import { desc } from 'drizzle-orm';
import { db } from '@/db/client';
import { links } from '@/db/schema';
import { type Either, makeRight } from '@/shared/either';
import type { Link } from '@/types/links';

export async function listShortLinks(): Promise<Either<never, Link[]>> {
  const items = await db.select().from(links).orderBy(desc(links.createdAt));

  return makeRight(items);
}
