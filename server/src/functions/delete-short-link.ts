import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { links } from '@/db/schema';
import { ShortLinkNotFoundError } from '@/errors/short-link-not-found.error';
import { type Either, makeLeft, makeRight } from '@/shared/either';

export async function deleteShortLink(
  shortUrl: string,
): Promise<Either<ShortLinkNotFoundError, null>> {
  const result = await db
    .delete(links)
    .where(eq(links.shortUrl, shortUrl))
    .returning();

  if (result.length === 0) {
    return makeLeft(new ShortLinkNotFoundError());
  }

  return makeRight(null);
}
