# Dockerfile for B2B Coffee Wholesale (Monorepo)
# Build toàn bộ Backend Microservices trong một Container

# Dùng node:22-slim thay vì alpine (hỗ trợ node:sqlite tốt hơn)
FROM node:22-slim AS builder

WORKDIR /app

# Cài đặt pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy toàn bộ monorepo config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY frontend/shared-ui/ ./frontend/shared-ui/
COPY backend/ ./backend/

# Cài đặt TẤT CẢ dependencies
RUN pnpm install --frozen-lockfile --no-optional

# Build shared packages trước
RUN pnpm --filter "@b2b-coffee/event-schemas" run build || true
RUN pnpm --filter "@b2b-coffee/shared-types" run build || true
RUN pnpm --filter "@b2b-coffee/shared-ui" run build || true

# Build backend services
RUN pnpm --filter "*-service" --filter "api-gateway" run build

# ─── PRODUCTION RUNNER ──────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy mọi thứ đã build
COPY --from=builder /app ./

# Bật tính năng thử nghiệm node:sqlite
ENV NODE_OPTIONS="--experimental-sqlite"

EXPOSE 4000

CMD ["pnpm", "run", "start:backend"]
