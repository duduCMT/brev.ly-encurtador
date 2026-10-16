import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { links } from '@/db/schema';
import { ShortLinkNotFoundError } from '@/errors/short-link-not-found.error';
import { type Either, makeLeft, makeRight } from '@/shared/either';

export async function incrementClickCountByShortUrl({
  shortUrl,
}: {
  shortUrl: string;
}): Promise<Either<ShortLinkNotFoundError, { clicks: number }>> {
  const result = await db
    .update(links)
    .set({ clicks: sql`${links.clicks} + 1` })
    .where(eq(links.shortUrl, shortUrl))
    .returning({
      clicks: links.clicks,
    });

  if (result.length === 0) {
    return makeLeft(new ShortLinkNotFoundError());
  }

  const link = result[0];

  return makeRight({ clicks: link.clicks });
}
