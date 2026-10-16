# Brev.ly

[![](https://img.shields.io/badge/TypeScript--3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![](https://img.shields.io/badge/Fastify--darkgray?logo=fastify)](https://fastify.dev/)
[![](https://img.shields.io/badge/Drizzle--C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![](https://img.shields.io/badge/PostgreSQL--336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![](https://img.shields.io/badge/React--20232A?logo=react)](https://react.dev/)
[![](https://img.shields.io/badge/Vite--646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![](https://img.shields.io/badge/Docker--blue?logo=docker)](https://docs.docker.com/)
[![](https://img.shields.io/badge/Cloudflare%20R2--F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/r2/)

## 🖼️ Preview

![Tela principal do Brev.ly](.github/assets/preview.png)

## 📝 Descrição

Encurtador de URLs com API e front-end. É possível criar links com um código personalizado, acessar o link encurtado para ser redirecionado à URL original (contando os acessos), listar, excluir e exportar todos os links para um CSV publicado no Cloudflare R2.

```
server/   API (Fastify, Drizzle, Postgres, Cloudflare R2)
web/      Front-end SPA (React, Vite, Tailwind)
```

## ⚡ Tecnologias

**Server**

- [NodeJS](https://nodejs.org/en) com TypeScript
- [Fastify](https://fastify.dev/) para a API
- [PostgreSQL](https://www.postgresql.org/) como banco de dados
- [Drizzle](https://orm.drizzle.team/) como ORM e migrations
- [Cloudflare R2](https://developers.cloudflare.com/r2/) para armazenar os CSVs
- [Vitest](https://vitest.dev/) para os testes
- [Docker](https://docs.docker.com/) para o banco e a imagem da API

**Web**

- [React](https://react.dev/) com TypeScript
- [Vite](https://vite.dev/) como bundler
- [Tailwind CSS](https://tailwindcss.com/) para os estilos
- [React Hook Form](https://react-hook-form.com/) e [Zod](https://zod.dev/) para os formulários

## 🚩 Setup

Pré-requisitos: Node 20, [pnpm](https://pnpm.io/) e Docker.

### Server

Crie o `.env` a partir do exemplo e preencha as variáveis (veja [Variáveis de ambiente](#-variáveis-de-ambiente)):

```sh
cd server
cp .env.example .env
```

Suba o banco de dados:

```sh
docker compose up -d db
```

Instale as dependências:

```sh
pnpm install
```

Crie as tabelas:

```sh
pnpm db:migrate
```

Inicie a API em modo de desenvolvimento (`http://localhost:3333`, documentação em `/docs`):

```sh
pnpm dev
```

Para rodar sem o modo de desenvolvimento:

```sh
pnpm build && pnpm start
```

Para parar o banco:

```sh
docker compose stop
```

### Web

```sh
cd web
cp .env.example .env
pnpm install
pnpm dev
```

A aplicação fica em `http://localhost:5173`.

## ⚙️ Variáveis de ambiente

**Server** (`server/.env`)

| Variável | Descrição |
| --- | --- |
| `PORT` | Porta da API |
| `DATABASE_URL` | Conexão Postgres (use `?sslmode=require` se o banco exigir SSL) |
| `CLOUDFLARE_ACCOUNT_ID` | ID da conta Cloudflare |
| `CLOUDFLARE_ACCESS_KEY_ID` | Access Key ID do token do R2 |
| `CLOUDFLARE_SECRET_ACCESS_KEY` | Secret Access Key do token do R2 |
| `CLOUDFLARE_BUCKET` | Nome do bucket |
| `CLOUDFLARE_PUBLIC_URL` | URL pública do bucket (CDN) |
| `FRONTEND_URL` | Opcional. Domínio usado nas URLs encurtadas do CSV (padrão `http://localhost:5173`) |

**Web** (`web/.env`)

| Variável | Descrição |
| --- | --- |
| `VITE_FRONTEND_URL` | URL pública do front (usada nos links encurtados) |
| `VITE_BACKEND_URL` | URL da API |

## 🔗 Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/links` | Cria link (`originalUrl`, `shortUrl`) |
| GET | `/links` | Lista todos os links |
| GET | `/links/:shortUrl` | URL original |
| PUT | `/links/:shortUrl/hit` | Incrementa acessos |
| DELETE | `/links/:shortUrl` | Remove |
| POST | `/links/export` | Gera o CSV no R2 e retorna `exportCsvUrl` |

A documentação interativa fica em `/docs`.

## 📜 Scripts

Em `server/`:

| Script | O que faz |
| --- | --- |
| `pnpm dev` | API em modo watch |
| `pnpm build` / `pnpm start` | Build e execução em produção |
| `pnpm db:migrate` | Aplica as migrations |
| `pnpm db:generate` | Gera uma migration a partir do schema |
| `pnpm test` | Roda os testes |
| `pnpm lint` | Verifica o código com o Biome |

Em `web/`:

| Script | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm lint` | Verifica o código com o ESLint |

## 🧪 Testes

Os testes usam um banco separado chamado `brevly_test`. Para criá-lo e aplicar as migrations:

```sh
docker compose exec db psql -U brevly -c "create database brevly_test"
DATABASE_URL=postgresql://brevly:brevly@localhost:5432/brevly_test pnpm db:migrate
```

Depois, em `server/`:

```sh
pnpm test
```

## 🐳 Docker

Para gerar a imagem da API:

```sh
docker build -t brevly-server ./server
```

Para aplicar as migrations dentro do container:

```sh
node dist/db/migrate.mjs
```

O `docker compose up` em `server/` sobe o Postgres e a API juntos.
