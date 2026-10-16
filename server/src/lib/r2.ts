import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { env } from '@/lib/env';
import {
  type ExportCsvToFileStorageValues,
  exportCsvToFileStorageSchema,
} from '@/schemas/export-csv.schema';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

export async function uploadCsvToFileStorage(
  data: ExportCsvToFileStorageValues,
) {
  const { fileName, contentStream } = exportCsvToFileStorageSchema.parse(data);

  const upload = new Upload({
    client: r2,
    params: {
      Bucket: env.CLOUDFLARE_BUCKET,
      Key: fileName,
      Body: contentStream,
      ContentType: 'text/csv; charset=utf-8',
    },
  });

  await upload.done();

  return {
    key: fileName,
    url: publicR2Url(fileName),
  };
}

function publicR2Url(key: string) {
  const base = env.CLOUDFLARE_PUBLIC_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedKey = key.replace(/^\/+/, '');
  return new URL(normalizedKey, normalizedBase).toString();
}
