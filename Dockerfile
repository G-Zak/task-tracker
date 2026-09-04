# syntax=docker/dockerfile:1

FROM node:20-bookworm AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm install

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

ARG NEXT_PUBLIC_WS_URL=ws://localhost:4001
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV SESSION_SECRET=build-time-placeholder
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY docker/entrypoint.sh ./entrypoint.sh
COPY docker/index-knowledge.sh ./index-knowledge.sh
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./entrypoint.sh ./index-knowledge.sh \
    && chown nextjs:nodejs ./entrypoint.sh ./index-knowledge.sh

USER nextjs
EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
