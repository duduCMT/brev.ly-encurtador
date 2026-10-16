import { db } from '@/db/client';
import { links } from '@/db/schema';
import { DuplicateShortLinkError } from '@/errors/duplicate-short-link.error';
import { InvalidOriginalUrlError } from '@/errors/invalid-original-url.error';
import { PoorlyFormattedShortUrlError } from '@/errors/poorly-formatted-short-url.error';
import { isHttpPublicUrl, normalizeHttpUrl } from '@/lib/normalize-url';
import {
  type CreateShortLinkValues,
  createShortLinkSchema,
} from '@/schemas/create-link.schema';
import { DEFAULT_PATTERN_SHORTLINK } from '@/shared/constants';
import { type Either, makeLeft, makeRight } from '@/shared/either';
import type { Link } from '@/types/links';

type CreateShortLinkError =
  | PoorlyFormattedShortUrlError
  | InvalidOriginalUrlError
  | DuplicateShortLinkError;

export async function createShortLink(
  data: CreateShortLinkValues,
): Promise<Either<CreateShortLinkError, Link>> {
  const { originalUrl, shortUrl } = createShortLinkSchema.parse(data);

  if (!DEFAULT_PATTERN_SHORTLINK.test(shortUrl)) {
    return makeLeft(new PoorlyFormattedShortUrlError());
  }

  const normalized = normalizeHttpUrl(originalUrl);

  if (!isHttpPublicUrl(normalized)) {
    return makeLeft(new InvalidOriginalUrlError());
  }

  const [created] = await db
    .insert(links)
    .values({ shortUrl, originalUrl: normalized })
    .onConflictDoNothing({ target: links.shortUrl })
    .returning();

  if (!created) {
    return makeLeft(new DuplicateShortLinkError());
  }

  return makeRight(created);
}
