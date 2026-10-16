import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { listShortLinks } from '@/functions';
import { unwrapEither } from '@/shared/either';
import { linkSchema, messageSchema } from '@/shared/http-schemas';

export const listShortLinksRoute: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/links',
    {
      schema: {
        summary: 'List all links and short links.',
        tags: ['shortlinks'],
        response: {
          200: z.array(linkSchema),
          500: messageSchema,
        },
      },
    },
    async (_, reply) => {
      const result = await listShortLinks();

      return reply.status(200).send(unwrapEither(result));
    },
  );
};
