import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { DuplicateShortLinkError } from '@/errors/duplicate-short-link.error';
import { InvalidOriginalUrlError } from '@/errors/invalid-original-url.error';
import { PoorlyFormattedShortUrlError } from '@/errors/poorly-formatted-short-url.error';
import { createShortLink } from '@/functions';
import { isRight, unwrapEither } from '@/shared/either';
import { linkSchema, messageSchema } from '@/shared/http-schemas';

export const createShortLinkRoute: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/links',
    {
      schema: {
        summary: 'Create a short link from original url.',
        tags: ['shortlinks'],
        body: z.object({
          originalUrl: z.string().trim().min(1).max(2048),
          shortUrl: z.string().min(1).max(128),
        }),
        response: {
          201: linkSchema,
          400: messageSchema,
          500: messageSchema,
        },
      },
    },
    async (request, reply) => {
      const result = await createShortLink(request.body);

      if (isRight(result)) {
        return reply.status(201).send(unwrapEither(result));
      }

      const error = unwrapEither(result);

      if (error instanceof DuplicateShortLinkError) {
        return reply
          .status(400)
          .send({ message: 'Short link already exists.' });
      }

      if (error instanceof PoorlyFormattedShortUrlError) {
        return reply
          .status(400)
          .send({ message: 'Short URL poorly formatted.' });
      }

      if (error instanceof InvalidOriginalUrlError) {
        return reply.status(400).send({ message: 'Invalid original URL.' });
      }

      return reply.status(500).send({ message: 'Internal server error.' });
    },
  );
};
