import { env } from '@/lib/env';
import { buildServer } from './server';

const app = buildServer();

app.listen({ port: env.PORT, host: '0.0.0.0' }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
