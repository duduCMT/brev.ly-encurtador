import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '@/server';
import { closeDb, resetLinks } from './helpers';

const app = buildServer();

beforeAll(() => app.ready());
beforeEach(resetLinks);
afterAll(async () => {
  await app.close();
  await closeDb();
});

function create(originalUrl: string, shortUrl: string) {
  return app.inject({
    method: 'POST',
    url: '/links',
    payload: { originalUrl, shortUrl },
  });
}

describe('POST /links', () => {
  it('creates a link', async () => {
    const res = await create('https://example.com', 'ex');

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      shortUrl: 'ex',
      originalUrl: 'https://example.com',
      clicks: 0,
    });
  });

  it('returns 400 for a duplicated short url', async () => {
    await create('https://a.com', 'dup');
    const res = await create('https://b.com', 'dup');

    expect(res.statusCode).toBe(400);
    expect(res.json().message).toBe('Short link already exists.');
  });

  it.each(['Ab c', 'a/b', 'a_b', ''])(
    'returns 400 for poorly formatted short url %j',
    async (shortUrl) => {
      const res = await create('https://a.com', shortUrl);

      expect(res.statusCode).toBe(400);
    },
  );

  it.each(['javascript:alert(1)', 'not a url', ''])(
    'returns 400 for invalid original url %j',
    async (originalUrl) => {
      const res = await create(originalUrl, 'ok');

      expect(res.statusCode).toBe(400);
    },
  );

  it('returns 400 when the body is missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {},
    });

    expect(res.statusCode).toBe(400);
  });
});

describe('edge-case requests', () => {
  it('returns 400 for a whitespace-only original url', async () => {
    const res = await create('   ', 'x');

    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for malformed json', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/links',
      headers: { 'content-type': 'application/json' },
      payload: '{bad',
    });

    expect(res.statusCode).toBe(400);
  });

  it.each(['a_b', 'a.b'])('returns 404 on get/hit for %j', async (code) => {
    const get = await app.inject({ method: 'GET', url: `/links/${code}` });
    const hit = await app.inject({ method: 'PUT', url: `/links/${code}/hit` });

    expect(get.statusCode).toBe(404);
    expect(hit.statusCode).toBe(404);
  });
});

describe('GET /links/:shortUrl', () => {
  it('returns the original url', async () => {
    await create('https://a.com', 'abc');
    const res = await app.inject({ method: 'GET', url: '/links/abc' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ originalUrl: 'https://a.com' });
  });

  it('returns 404 for an unknown short url', async () => {
    const res = await app.inject({ method: 'GET', url: '/links/nope' });

    expect(res.statusCode).toBe(404);
  });
});

describe('PUT /links/:shortUrl/hit', () => {
  it('increments the clicks', async () => {
    await create('https://a.com', 'hit');
    await app.inject({ method: 'PUT', url: '/links/hit/hit' });
    const res = await app.inject({ method: 'PUT', url: '/links/hit/hit' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ clicks: 2 });
  });

  it('returns 404 for an unknown short url', async () => {
    const res = await app.inject({ method: 'PUT', url: '/links/nope/hit' });

    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /links/:shortUrl', () => {
  it('deletes a link', async () => {
    await create('https://a.com', 'del');
    const res = await app.inject({ method: 'DELETE', url: '/links/del' });
    const after = await app.inject({ method: 'GET', url: '/links/del' });

    expect(res.statusCode).toBe(204);
    expect(after.statusCode).toBe(404);
  });

  it('returns 404 for an unknown short url', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/links/nope' });

    expect(res.statusCode).toBe(404);
  });
});

describe('GET /links', () => {
  it('lists all links, newest first', async () => {
    for (const code of ['one', 'two', 'three']) {
      await create('https://a.com', code);
    }
    const res = await app.inject({ method: 'GET', url: '/links' });

    expect(res.statusCode).toBe(200);
    expect(res.json().map((l: { shortUrl: string }) => l.shortUrl)).toEqual([
      'three',
      'two',
      'one',
    ]);
  });

  it('returns an empty array when there are no links', async () => {
    const res = await app.inject({ method: 'GET', url: '/links' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual([]);
  });
});

describe('misc', () => {
  it('answers CORS preflight', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: '/links/abc',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'DELETE',
      },
    });

    expect(res.headers['access-control-allow-origin']).toBe('*');
    expect(res.headers['access-control-allow-methods']).toContain('DELETE');
  });

  it('serves health and docs', async () => {
    expect((await app.inject({ url: '/health' })).statusCode).toBe(200);
    expect((await app.inject({ url: '/docs/json' })).statusCode).toBe(200);
  });
});
