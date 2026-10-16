import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ShortLinkNotFoundError } from '@/errors/short-link-not-found.error';
import { incrementClickCountByShortUrl } from '@/functions';
import { isRight, unwrapEither } from '@/shared/either';
import { messageSchema } from '@/shared/http-schemas';

export const incrementClickToShortLinkRoute: FastifyPluginAsyncZod = async (
  app,
) => {
  app.put(
    '/links/:shortUrl/hit',
    {
      schema: {
        summary: 'Increment click on short link.',
        tags: ['shortlinks'],
        params: z.object({ shortUrl: z.string().min(1) }),
        response: {
          200: z.object({ clicks: z.number() }),
          404: messageSchema,
          500: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await incrementClickCountByShortUrl(request.params);

      if (isRight(result)) {
        return reply.status(200).send(unwrapEither(result));
      }

      const error = unwrapEither(result);

      if (error instanceof ShortLinkNotFoundError) {
        return reply.status(404).send({ message: error.message });
      }

      return reply.status(500).send({ message: 'Internal server error.' });
    },
  );
};
