# Dockerfile for B2B Coffee Wholesale (Monorepo)
# Xây dựng toàn bộ hệ thống Microservices trong một Container để đơn giản hóa VPS Deployment

FROM node:20-alpine AS builder

# Thiết lập thư mục gốc
WORKDIR /app

# Cài đặt pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy the monorepo config files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY frontend/shared-ui ./frontend/shared-ui
COPY packages/ ./packages/
COPY backend/ ./backend/

# Xóa Frontend Portal khỏi Docker build nếu không cần thiết chạy trên cùng Server để nhẹ bộ nhớ
# Tuy nhiên, lockfile có thể yêu cầu toàn bộ workspace, nên ta cài đặt filter
RUN pnpm install --frozen-lockfile --filter "*-service" --filter "api-gateway" --filter "@b2b-coffee/shared-ui" --filter "@b2b-coffee/event-schemas"

# Build toàn bộ backend
RUN pnpm --filter "*-service" --filter "api-gateway" run build

# ─── MÔI TRƯỜNG CHẠY THỰC TẾ ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Chỉ lấy những gì đã build từ bước trên
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/backend ./backend

# Mở cổng API Gateway (Mặc định 4000)
EXPOSE 4000 4001 4002 4003 4004 4005 4006

# Chạy Command gốc từ file package.json thông qua Concurrently cho hệ thống Microservices
CMD ["pnpm", "run", "start:backend"]
