FROM node:20.18-alpine AS base

RUN npm install -g pnpm@10

WORKDIR /usr/src/app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN pnpm run build && pnpm prune --prod

FROM gcr.io/distroless/nodejs20-debian12 AS deploy

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY --from=build --chown=nonroot:nonroot /usr/src/app/dist ./dist
COPY --from=build --chown=nonroot:nonroot /usr/src/app/drizzle ./drizzle
COPY --from=build --chown=nonroot:nonroot /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=nonroot:nonroot /usr/src/app/package.json ./package.json

USER nonroot

EXPOSE 3333

CMD ["dist/index.mjs"]
