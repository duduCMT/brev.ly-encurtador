import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/client';
import { links } from '@/db/schema';
import { DuplicateShortLinkError } from '@/errors/duplicate-short-link.error';
import { InvalidOriginalUrlError } from '@/errors/invalid-original-url.error';
import { PoorlyFormattedShortUrlError } from '@/errors/poorly-formatted-short-url.error';
import { ShortLinkNotFoundError } from '@/errors/short-link-not-found.error';
import {
  createShortLink,
  deleteShortLink,
  exportShortLinksToCsv,
  getOriginalUrlByShortUrl,
  incrementClickCountByShortUrl,
  listShortLinks,
} from '@/functions';
import { isLeft, isRight, unwrapEither } from '@/shared/either';
import { closeDb, resetLinks } from './helpers';

const uploaded: { fileName: string; content: string }[] = [];

vi.mock('@/lib/r2', () => ({
  uploadCsvToFileStorage: vi.fn(
    async ({
      fileName,
      contentStream,
    }: {
      fileName: string;
      contentStream: AsyncIterable<Buffer>;
    }) => {
      const chunks: Buffer[] = [];
      for await (const chunk of contentStream) chunks.push(Buffer.from(chunk));
      uploaded.push({ fileName, content: Buffer.concat(chunks).toString() });
      return { key: fileName, url: `http://cdn.test/${fileName}` };
    },
  ),
}));

beforeEach(async () => {
  uploaded.length = 0;
  await resetLinks();
});

afterAll(closeDb);

describe('createShortLink', () => {
  it('creates a link and normalizes the original url', async () => {
    const result = await createShortLink({
      originalUrl: 'www.example.com',
      shortUrl: 'example',
    });

    expect(isRight(result)).toBe(true);
    const link = unwrapEither(result) as {
      originalUrl: string;
      clicks: number;
    };
    expect(link.originalUrl).toBe('https://www.example.com');
    expect(link.clicks).toBe(0);
  });

  it('rejects a duplicated short url', async () => {
    await createShortLink({ originalUrl: 'https://a.com', shortUrl: 'dup' });
    const result = await createShortLink({
      originalUrl: 'https://b.com',
      shortUrl: 'dup',
    });

    expect(isLeft(result)).toBe(true);
    expect(unwrapEither(result)).toBeInstanceOf(DuplicateShortLinkError);
  });

  it('accepts only one of two concurrent creations of the same short url', async () => {
    const results = await Promise.all([
      createShortLink({ originalUrl: 'https://a.com', shortUrl: 'race' }),
      createShortLink({ originalUrl: 'https://b.com', shortUrl: 'race' }),
    ]);

    expect(results.filter(isRight)).toHaveLength(1);
    expect(
      results.filter(isLeft).map((r) => unwrapEither(r))[0],
    ).toBeInstanceOf(DuplicateShortLinkError);
  });

  it.each(['a b', 'a/b', 'ação', 'a_b', 'a.b', '   '])(
    'rejects poorly formatted short url %j',
    async (shortUrl) => {
      const result = await createShortLink({
        originalUrl: 'https://a.com',
        shortUrl,
      });

      expect(unwrapEither(result)).toBeInstanceOf(PoorlyFormattedShortUrlError);
    },
  );

  it.each([
    'javascript:alert(1)',
    'not a url',
    'ftp://a.com',
    'http://localhost',
  ])('rejects invalid original url %j', async (originalUrl) => {
    const result = await createShortLink({ originalUrl, shortUrl: 'ok' });

    expect(unwrapEither(result)).toBeInstanceOf(InvalidOriginalUrlError);
  });
});

describe('getOriginalUrlByShortUrl', () => {
  it('returns the original url', async () => {
    await createShortLink({ originalUrl: 'https://a.com', shortUrl: 'get' });
    const result = await getOriginalUrlByShortUrl({ shortUrl: 'get' });

    expect(unwrapEither(result)).toEqual({ originalUrl: 'https://a.com' });
  });

  it('returns not found for an unknown short url', async () => {
    const result = await getOriginalUrlByShortUrl({ shortUrl: 'nope' });

    expect(unwrapEither(result)).toBeInstanceOf(ShortLinkNotFoundError);
  });
});

describe('incrementClickCountByShortUrl', () => {
  it('increments the clicks atomically', async () => {
    await createShortLink({ originalUrl: 'https://a.com', shortUrl: 'hit' });
    await Promise.all([
      incrementClickCountByShortUrl({ shortUrl: 'hit' }),
      incrementClickCountByShortUrl({ shortUrl: 'hit' }),
    ]);
    const result = await incrementClickCountByShortUrl({ shortUrl: 'hit' });

    expect(unwrapEither(result)).toEqual({ clicks: 3 });
  });

  it('returns not found for an unknown short url', async () => {
    const result = await incrementClickCountByShortUrl({ shortUrl: 'nope' });

    expect(unwrapEither(result)).toBeInstanceOf(ShortLinkNotFoundError);
  });
});

describe('deleteShortLink', () => {
  it('deletes an existing link', async () => {
    await createShortLink({ originalUrl: 'https://a.com', shortUrl: 'del' });

    expect(isRight(await deleteShortLink('del'))).toBe(true);
    expect(await db.$count(links)).toBe(0);
  });

  it('returns not found for an unknown short url', async () => {
    expect(unwrapEither(await deleteShortLink('nope'))).toBeInstanceOf(
      ShortLinkNotFoundError,
    );
  });
});

describe('listShortLinks', () => {
  it('lists newest first', async () => {
    for (const code of ['one', 'two', 'three']) {
      await createShortLink({ originalUrl: 'https://a.com', shortUrl: code });
    }

    const result = unwrapEither(await listShortLinks());

    expect(result.map((l) => l.shortUrl)).toEqual(['three', 'two', 'one']);
  });

  it('returns every link with no cap', async () => {
    await db.insert(links).values(
      Array.from({ length: 150 }, (_, i) => ({
        originalUrl: 'https://a.com',
        shortUrl: `link-${i}`,
      })),
    );

    expect(unwrapEither(await listShortLinks())).toHaveLength(150);
  });
});

describe('exportShortLinksToCsv', () => {
  it('uploads a csv with header and rows under a unique name', async () => {
    await createShortLink({ originalUrl: 'https://a.com', shortUrl: 'csv1' });
    await createShortLink({ originalUrl: 'https://b.com', shortUrl: 'csv2' });

    const first = unwrapEither(await exportShortLinksToCsv());
    const second = unwrapEither(await exportShortLinksToCsv());

    expect(first.exportCsvUrl).toMatch(/^http:\/\/cdn\.test\/.+\.csv$/);
    expect(first.exportCsvUrl).not.toBe(second.exportCsvUrl);

    const lines = uploaded[0].content.replace(/^﻿/, '').trim().split('\n');
    expect(lines[0]).toBe('Original URL,Short URL,Access Count,Created at');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain('https://a.com');
    expect(lines[1]).toContain('http://localhost:5173/csv1');
  });

  it('exports only the header when there are no links', async () => {
    unwrapEither(await exportShortLinksToCsv());

    const lines = uploaded[0].content.replace(/^﻿/, '').trim().split('\n');
    expect(lines).toEqual(['Original URL,Short URL,Access Count,Created at']);
  });
});
