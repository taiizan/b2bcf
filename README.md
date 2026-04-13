# ☕ B2B Coffee Wholesale Portal

> Nền tảng thương mại điện tử B2B chuyên biệt cho thị trường bán buôn cà phê, xây dựng trên kiến trúc **Microservices** và **Event-Driven Architecture**.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                 UNIFIED FRONTEND PORTAL (:3001)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /buyer       │  │ /supplier    │  │ /admin       │          │
│  │ (Buyer)      │  │ (Supplier)   │  │ (Admin)      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────┐        │
│  │              API GATEWAY (:4000)                    │        │
│  │     JWT Auth • Rate Limiting • Route Proxy          │        │
│  └──────┬──────┬──────┬──────┬──────┬──────┬──────────┘        │
│         │      │      │      │      │      │                    │
│  ┌──────┴──┐┌──┴───┐┌─┴──┐┌─┴──┐┌──┴──┐┌──┴───┐              │
│  │  User   ││ RFQ  ││Ord-││Chat││Noti-││  AI  │              │
│  │ Service ││Servi-││er  ││Serv││fica-││Servi-│              │
│  │ :4001   ││ce    ││Serv││ice ││tion ││ce    │              │
│  │         ││:4002 ││:400││:400││:4005││:4006 │              │
│  └─────────┘└──────┘└────┘└────┘└─────┘└──────┘              │
│                            │                                     │
│  ┌─────────────────────────┴──────────────────────────┐        │
│  │          IN-MEMORY EVENT BUS (EventBus)             │        │
│  │     Local dev replacement for RabbitMQ / Kafka      │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
npm install -g pnpm
cd B2bCf
pnpm install
```

### 2. Seed dữ liệu mẫu

```bash
cd backend/user-service
npx tsx src/seed.ts
```

### 3. Chạy tất cả services

```bash
# Terminal 1: Start tất cả backend services
pnpm dev:services

# Terminal 2: Start tất cả frontend portals
pnpm dev:frontend
```

Hoặc chạy cùng lúc:
```bash
pnpm dev
```

### 4. Truy cập

| Portal | URL | Tài khoản demo |
|--------|-----|----------------|
| **Buyer Portal** | http://localhost:3001/buyer | buyer@highland.vn / password123 |
| **Supplier Portal** | http://localhost:3001/supplier | supplier@trungnguyên.vn / password123 |
| **Admin Dashboard** | http://localhost:3001/admin | admin@b2bcoffee.vn / password123 |
| **API Gateway** | http://localhost:4000/health | — |

## 📂 Cấu trúc Monorepo

```
B2bCf/
├── packages/
│   ├── shared-types/         # TypeScript interfaces (CoffeeBean, RFQ, PO...)
│   └── event-schemas/        # Event types + In-memory EventBus
│
├── backend/
│   ├── api-gateway/          # Express proxy, JWT auth, rate limiting
│   ├── user-service/         # Registration, Login, JWT, Company mgmt
│   ├── rfq-service/          # Products, RFQ lifecycle, Quotes
│   ├── order-service/        # Purchase Orders, Transaction Lock
│   ├── chat-service/         # Socket.IO real-time negotiation
│   ├── notification-service/ # Event consumer, notification API
│   └── ai-service/           # Price forecasting, market insights
│
├── frontend/
│   ├── shared-ui/            # Design tokens, utilities
│   └── apps/
│       └── portal/           # Next.js App Router — Unified frontend portal
│           ├── src/app/buyer/    # Buyer functions
│           ├── src/app/supplier/ # Supplier functions
│           └── src/app/admin/    # Admin functions
│
├── infrastructure/
│   └── docker-compose.yml    # PostgreSQL, MongoDB, Redis, RabbitMQ
│
└── docs/                     # Architecture documentation
```

## ⚡ Event-Driven Flow

```
Buyer tạo RFQ ──→ [RFQ_SUBMITTED] ──→ Notification Service
                                   ──→ AI Service (collect data)

Supplier gửi Quote ──→ [QUOTE_SUBMITTED] ──→ Notification → Buyer

Buyer chấp nhận ──→ [QUOTE_ACCEPTED]

Order Service tạo PO ──→ [PO_CREATED] ──→ RFQ Service (close RFQ)
                                       ──→ Notification (alert Supplier)
                                       ──→ AI Service (price data)
                     ──→ [INVENTORY_LOCKED] ──→ Notification
```

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Recharts |
| Backend | Express.js, TypeScript, SQLite (better-sqlite3) |
| Real-time | Socket.IO (Chat Service) |
| Event Bus | In-memory EventBus (prod: RabbitMQ/Kafka) |
| Database | SQLite (local), PostgreSQL + MongoDB (prod) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Monorepo | pnpm workspaces |
| Infrastructure | Docker Compose (optional) |

## 🔐 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Buyer | buyer@highland.vn | password123 |
| Buyer | buyer@coffeehouse.vn | password123 |
| Supplier | supplier@trungnguyên.vn | password123 |
| Supplier | farmer@daklak.vn | password123 |
| Supplier | supplier@lamdong.vn | password123 |
| Admin | admin@b2bcoffee.vn | password123 |
