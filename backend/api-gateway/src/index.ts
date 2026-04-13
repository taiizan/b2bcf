// ═══════════════════════════════════════════════════════════════
// API Gateway — Single Entry Point, Routing, Auth & Rate Limiting
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import { createProxyMiddleware, type Options } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'b2b-coffee-secret-key-2024';

// ── Service Registry ─────────────────────────────────────────
const SERVICES: Record<string, string> = {
  'user-service': process.env.USER_SERVICE_URL || 'http://localhost:4001',
  'rfq-service': process.env.RFQ_SERVICE_URL || 'http://localhost:4002',
  'order-service': process.env.ORDER_SERVICE_URL || 'http://localhost:4003',
  'chat-service': process.env.CHAT_SERVICE_URL || 'http://localhost:4004',
  'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005',
  'ai-service': process.env.AI_SERVICE_URL || 'http://localhost:4006',
};

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3000'],
  credentials: true,
}));
app.use(morgan('[:date[clf]] :method :url :status :response-time[0]ms'));
// express.json() removed to allow http-proxy-middleware to stream the body unmodified

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// app.use(limiter); // Disabled for development to avoid 429 Too Many Requests

// ── Auth Middleware (skip for public routes) ─────────────────
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/health',
  '/api/gateway/services',
];

function authMiddleware(req: any, res: any, next: any) {
  const isPublic = PUBLIC_ROUTES.some((route) => req.path.startsWith(route));
  if (isPublic) return next();

  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-company-id'] = decoded.companyId;
    next();
  } catch {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

app.use(authMiddleware);

// ── Gateway Routes ───────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: Object.entries(SERVICES).map(([name, url]) => ({ name, url })),
  });
});

// Service discovery
app.get('/api/gateway/services', (_req, res) => {
  res.json({
    success: true,
    data: Object.entries(SERVICES).map(([name, url]) => ({ name, url, status: 'up' })),
  });
});

// ── Route Proxying ───────────────────────────────────────────

function createProxy(target: string): Options {
  return {
    target,
    changeOrigin: true,
    pathRewrite: (path: string, req: any) => req.baseUrl + path,
    timeout: 30000,
    on: {
      error: (err, _req, res: any) => {
        console.error(`[Gateway] Proxy error to ${target}:`, err.message);
        if (res.writeHead) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: `Service unavailable: ${err.message}` }));
        }
      },
    },
  };
}

// Auth routes → User Service
app.use('/api/auth', createProxyMiddleware(createProxy(SERVICES['user-service'])));
app.use('/api/users', createProxyMiddleware(createProxy(SERVICES['user-service'])));
app.use('/api/companies', createProxyMiddleware(createProxy(SERVICES['user-service'])));

// Product & RFQ routes → RFQ Service
app.use('/api/products', createProxyMiddleware(createProxy(SERVICES['rfq-service'])));
app.use('/api/rfqs', createProxyMiddleware(createProxy(SERVICES['rfq-service'])));
app.use('/api/quotes', createProxyMiddleware(createProxy(SERVICES['rfq-service'])));

// Order routes → Order Service
app.use('/api/orders', createProxyMiddleware(createProxy(SERVICES['order-service'])));

// Chat routes → Chat Service
app.use('/api/chat', createProxyMiddleware(createProxy(SERVICES['chat-service'])));

// Notification routes → Notification Service
app.use('/api/notifications', createProxyMiddleware(createProxy(SERVICES['notification-service'])));
app.use('/api/events', createProxyMiddleware(createProxy(SERVICES['notification-service'])));

// AI routes → AI Service
app.use('/api/ai', createProxyMiddleware(createProxy(SERVICES['ai-service'])));

// ── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 ═══════════════════════════════════════════════════════`);
  console.log(`   B2B Coffee Wholesale — API Gateway`);
  console.log(`   Port: ${PORT}`);
  console.log(`   ─────────────────────────────────────────────────────`);
  Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`   ${name.padEnd(25)} → ${url}`);
  });
  console.log(`═══════════════════════════════════════════════════════\n`);
});

export default app;
