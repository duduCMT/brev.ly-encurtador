import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { links } from '@/db/schema';
import { ShortLinkNotFoundError } from '@/errors/short-link-not-found.error';
import { type Either, makeLeft, makeRight } from '@/shared/either';

export async function getOriginalUrlByShortUrl({
  shortUrl,
}: {
  shortUrl: string;
}): Promise<Either<ShortLinkNotFoundError, { originalUrl: string }>> {
  const result = await db
    .select()
    .from(links)
    .where(eq(links.shortUrl, shortUrl));

  if (result.length === 0) {
    return makeLeft(new ShortLinkNotFoundError());
  }

  const link = result[0];

  return makeRight({ originalUrl: link.originalUrl });
}
