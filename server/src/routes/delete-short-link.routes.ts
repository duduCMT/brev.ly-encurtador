import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ShortLinkNotFoundError } from '@/errors/short-link-not-found.error';
import { deleteShortLink } from '@/functions';
import { isRight, unwrapEither } from '@/shared/either';
import { messageSchema } from '@/shared/http-schemas';

export const deleteShortLinkRoute: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/links/:shortUrl',
    {
      schema: {
        summary: 'Delete a short link by short url.',
        tags: ['shortlinks'],
        params: z.object({ shortUrl: z.string().min(1) }),
        response: {
          204: z.null(),
          404: messageSchema,
          500: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await deleteShortLink(request.params.shortUrl);

      if (isRight(result)) {
        return reply.status(204).send();
      }

      const error = unwrapEither(result);

      if (error instanceof ShortLinkNotFoundError) {
        return reply.status(404).send({ message: error.message });
      }

      return reply.status(500).send({ message: 'Internal server error.' });
    },
  );
};
