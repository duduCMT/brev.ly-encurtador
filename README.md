# Brev.ly

Encurtador de URLs. API em Fastify + Drizzle + Postgres e SPA em React + Vite.

```
server/   API (TypeScript, Fastify, Drizzle, Postgres, Cloudflare R2)
web/      Front-end (React, Vite, Tailwind)
```

## Setup inicial

### Server

```bash
cd server
cp .env.example .env
docker compose up -d db
pnpm install
pnpm db:migrate
pnpm dev
```

### Web

```bash
cd web
cp .env.example .env
pnpm install
pnpm dev
```

## Server

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta da API |
| `DATABASE_URL` | Conexão Postgres (use `?sslmode=require` se o banco exigir SSL) |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ACCESS_KEY_ID`, `CLOUDFLARE_SECRET_ACCESS_KEY`, `CLOUDFLARE_BUCKET` | Credenciais e bucket do R2 |
| `CLOUDFLARE_PUBLIC_URL` | URL pública do bucket (CDN) |
| `FRONTEND_URL` | Opcional. Domínio usado nas URLs encurtadas do CSV (padrão `http://localhost:5173`) |

| Script | O que faz |
| --- | --- |
| `pnpm dev` | API em modo watch |
| `pnpm db:migrate` | Aplica as migrations |
| `pnpm db:generate` | Gera migration a partir do schema |
| `pnpm test` | Testes (precisam de um Postgres `brevly_test`, ver `tests/setup.ts`) |
| `pnpm build` / `pnpm start` | Build e execução em produção |

Docker: `docker build -t brevly-server ./server`. Para migrar dentro do container: `node dist/db/migrate.mjs`. O `docker compose up` sobe Postgres e API.

### Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/links` | Cria link (`originalUrl`, `shortUrl`) |
| GET | `/links` | Lista todos os links |
| GET | `/links/:shortUrl` | URL original |
| PUT | `/links/:shortUrl/hit` | Incrementa acessos |
| DELETE | `/links/:shortUrl` | Remove |
| POST | `/links/export` | Gera o CSV no R2 e retorna `exportCsvUrl` |

Documentação interativa em `/docs`.

## Web

| Variável | Descrição |
| --- | --- |
| `VITE_FRONTEND_URL` | URL pública do front (usada nos links encurtados) |
| `VITE_BACKEND_URL` | URL da API |
