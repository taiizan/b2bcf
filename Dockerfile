# Dockerfile for B2B Coffee Wholesale (Monorepo)
# Gộp tất cả Microservices vào 1 process để tiết kiệm RAM (Free Tier)

FROM node:22-slim AS builder

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY frontend/shared-ui/ ./frontend/shared-ui/
COPY backend/ ./backend/

# Cài dependencies
RUN pnpm install --frozen-lockfile --no-optional

# Build shared packages
RUN pnpm --filter "@b2b-coffee/event-schemas" run build || true
RUN pnpm --filter "@b2b-coffee/shared-types" run build || true
RUN pnpm --filter "@b2b-coffee/shared-ui" run build || true

# Build backend
RUN pnpm --filter "*-service" --filter "api-gateway" run build

# ─── PRODUCTION RUNNER ──────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=builder /app ./
COPY server.js ./server.js

# Tạo thư mục data cho SQLite
RUN mkdir -p backend/user-service/data \
    backend/rfq-service/data \
    backend/order-service/data \
    backend/chat-service/data \
    backend/notification-service/data \
    backend/ai-service/data

ENV NODE_OPTIONS="--experimental-sqlite --max-old-space-size=384"
ENV GATEWAY_PORT="10000"
EXPOSE 10000

# Chạy 1 process duy nhất thay vì 7
CMD ["node", "server.js"]
