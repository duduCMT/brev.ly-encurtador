import { randomUUID } from 'node:crypto';
import { PassThrough, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { stringify } from 'csv-stringify';
import { asc } from 'drizzle-orm';
import { db, pg } from '@/db/client';
import { links } from '@/db/schema';
import { env } from '@/lib/env';
import { formatDateToBR } from '@/lib/format-date-to-br';
import { uploadCsvToFileStorage } from '@/lib/r2';
import { type Either, makeRight } from '@/shared/either';

type LinkRow = {
  original_url: string;
  short_url: string;
  clicks: number;
  created_at: string;
};

export async function exportShortLinksToCsv(): Promise<
  Either<never, { exportCsvUrl: string }>
> {
  const csvFileName = `exports/export_csv_short_links_${randomUUID()}.csv`;

  const csvHeader = stringify({
    header: true,
    bom: true,
    columns: [
      { key: 'original_url', header: 'Original URL' },
      { key: 'short_url', header: 'Short URL' },
      { key: 'clicks', header: 'Access Count' },
      { key: 'created_at', header: 'Created at' },
    ],
  });

  const { sql, params } = db
    .select({
      originalUrl: links.originalUrl,
      shortUrl: links.shortUrl,
      clicks: links.clicks,
      createdAt: links.createdAt,
    })
    .from(links)
    .orderBy(asc(links.createdAt))
    .toSQL();

  const cursor = pg.unsafe(sql, params as string[]).cursor(50);

  const csvStream = new PassThrough();

  const csvPipeline = pipeline(
    cursor,
    new Transform({
      objectMode: true,
      transform(rows: LinkRow[], _, done) {
        for (const row of rows) {
          this.push({
            ...row,
            short_url: `${env.FRONTEND_URL}/${row.short_url}`,
            created_at: formatDateToBR.format(new Date(row.created_at)),
          });
        }
        done();
      },
    }),
    csvHeader,
    csvStream,
  );

  try {
    const [{ url }] = await Promise.all([
      uploadCsvToFileStorage({
        fileName: csvFileName,
        contentStream: csvStream,
      }),
      csvPipeline,
    ]);

    return makeRight({ exportCsvUrl: url });
  } catch (error) {
    csvStream.destroy();
    throw error;
  }
}
