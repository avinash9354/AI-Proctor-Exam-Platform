FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY services/auth-service/package.json ./services/auth-service/
RUN npm ci --workspace=services/auth-service

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY services/auth-service ./services/auth-service
COPY tsconfig.json ./
RUN cd services/auth-service && npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/services/auth-service/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY packages/database/prisma ./prisma

EXPOSE 4001
CMD ["node", "dist/index.js"]
