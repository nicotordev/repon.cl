FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace files (context is repo root when Root Directory is empty on Railway)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

COPY apps/frontend ./apps/frontend

ARG NEXT_PUBLIC_DIRECTUS_URL=http://localhost:8055
ENV NEXT_PUBLIC_DIRECTUS_URL=${NEXT_PUBLIC_DIRECTUS_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Build only the frontend app
RUN pnpm --filter frontend build

# Move static files to the correct standalone location (monorepo: .next is under apps/frontend/)
RUN if [ -d apps/frontend/.next/standalone/apps/frontend ]; then \
  cp -r apps/frontend/.next/static apps/frontend/.next/standalone/apps/frontend/.next/static && \
  (cp -r apps/frontend/public apps/frontend/.next/standalone/apps/frontend/public 2>/dev/null || true); \
  else \
  cp -r apps/frontend/.next/static apps/frontend/.next/standalone/.next/static && \
  (cp -r apps/frontend/public apps/frontend/.next/standalone/public 2>/dev/null || true); \
  fi

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Standalone output includes its own node_modules (monorepo: under apps/frontend/)
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./

USER nextjs
EXPOSE 3000

# Explicitly use node to avoid the "pnpm not found" error
CMD ["sh", "-c", "if [ -f apps/frontend/server.js ]; then node apps/frontend/server.js; else node server.js; fi"]
