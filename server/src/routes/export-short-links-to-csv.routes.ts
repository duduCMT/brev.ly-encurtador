import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { exportShortLinksToCsv } from '@/functions';
import { unwrapEither } from '@/shared/either';
import { messageSchema } from '@/shared/http-schemas';

export const exportShortLinksToCsvRoute: FastifyPluginAsyncZod = async (
  app,
) => {
  app.post(
    '/links/export',
    {
      schema: {
        summary: 'Export short links to CSV file.',
        tags: ['shortlinks'],
        response: {
          200: z.object({ exportCsvUrl: z.url() }),
          500: messageSchema,
        },
      },
    },
    async (_, reply) => {
      const { exportCsvUrl } = unwrapEither(await exportShortLinksToCsv());

      return reply.status(200).send({ exportCsvUrl });
    },
  );
};
