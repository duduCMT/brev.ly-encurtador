import { fastifyCors } from '@fastify/cors';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { createShortLinkRoute } from './routes/create-short-link.routes';
import { deleteShortLinkRoute } from './routes/delete-short-link.routes';
import { exportShortLinksToCsvRoute } from './routes/export-short-links-to-csv.routes';
import { getOriginalLinkByShortUrlRoute } from './routes/get-original-url-by-short-url.routes';
import { incrementClickToShortLinkRoute } from './routes/increment-click-to-short-link.routes';
import { listShortLinksRoute } from './routes/list-short-links.routes';

export function buildServer() {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);

  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        message: 'Validation error.',
        errors: error.validation[0]?.message,
      });
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ message: error.message });
    }

    request.log.error(error);
    return reply.code(500).send({ message: 'Internal server error.' });
  });

  app.register(fastifyCors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  app.register(fastifySwagger, {
    openapi: { info: { title: 'Brev.ly API', version: '1.0.0' } },
    transform: jsonSchemaTransform,
  });
  app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  app.register(listShortLinksRoute);
  app.register(createShortLinkRoute);
  app.register(deleteShortLinkRoute);
  app.register(getOriginalLinkByShortUrlRoute);
  app.register(incrementClickToShortLinkRoute);
  app.register(exportShortLinksToCsvRoute);

  app.get('/health', async () => ({ ok: true }));

  return app;
}
