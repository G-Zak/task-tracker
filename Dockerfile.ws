# syntax=docker/dockerfile:1

FROM node:20-bookworm AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install

FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

USER nextjs
EXPOSE 4001
CMD ["npx", "tsx", "server/ws-server.ts"]
