# Dockerfile for B2B Coffee Wholesale (Monorepo)
# Build toàn bộ Backend Microservices trong một Container

# Node 22 vì backend sử dụng node:sqlite (built-in từ Node 22.5+)
FROM node:22-alpine AS builder

WORKDIR /app

# Cài đặt pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy toàn bộ monorepo config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY frontend/shared-ui/ ./frontend/shared-ui/
COPY backend/ ./backend/

# Cài đặt TẤT CẢ dependencies (bao gồm devDeps có concurrently)
RUN pnpm install --frozen-lockfile --no-optional

# Build shared packages trước
RUN pnpm --filter "@b2b-coffee/event-schemas" run build || true
RUN pnpm --filter "@b2b-coffee/shared-types" run build || true
RUN pnpm --filter "@b2b-coffee/shared-ui" run build || true

# Build backend services
RUN pnpm --filter "*-service" --filter "api-gateway" run build

# ─── PRODUCTION RUNNER ──────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy mọi thứ đã build (concurrently đã có sẵn từ builder)
COPY --from=builder /app ./

EXPOSE 4000

CMD ["pnpm", "run", "start:backend"]
