process.env.DATABASE_URL ??=
  'postgresql://brevly:brevly@localhost:5432/brevly_test';
process.env.CLOUDFLARE_ACCOUNT_ID ??= 'test';
process.env.CLOUDFLARE_ACCESS_KEY_ID ??= 'test';
process.env.CLOUDFLARE_SECRET_ACCESS_KEY ??= 'test';
process.env.CLOUDFLARE_BUCKET ??= 'test';
process.env.CLOUDFLARE_PUBLIC_URL ??= 'http://localhost:9000';
process.env.FRONTEND_URL ??= 'http://localhost:5173';
process.env.NODE_ENV = 'test';
