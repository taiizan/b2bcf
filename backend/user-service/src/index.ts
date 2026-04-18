// ═══════════════════════════════════════════════════════════════
// User Service — Registration, Auth (JWT), Company & Role Mgmt
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseSync as Database } from 'node:sqlite';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'b2b-coffee-secret-key-2024';

// ── Database Setup ───────────────────────────────────────────

const dbPath = path.join(__dirname, '..', 'data', 'users.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT DEFAULT '',
    country TEXT DEFAULT 'Vietnam',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    taxId TEXT,
    rating REAL DEFAULT 0,
    verified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'BUYER',
    companyId TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (companyId) REFERENCES companies(id)
  );
`);

// ── Auth Middleware ──────────────────────────────────────────

// ── Auto-seed demo data if DB is empty ──────────────────────
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
if (userCount.count === 0) {
  console.log('📦 Seeding demo accounts...');
  const bcryptSync = require('bcryptjs');

  const demoData = [
    { email: 'buyer@highland.vn', name: 'Highland Buyer', role: 'BUYER', company: 'Highland Coffee', companyType: 'CAFE_CHAIN' },
    { email: 'farmer@daklak.vn', name: 'Dak Lak Farmer', role: 'SUPPLIER', company: 'Dak Lak Coffee Farm', companyType: 'FARM' },
    { email: 'admin@b2bcoffee.vn', name: 'B2B Admin', role: 'ADMIN', company: 'B2B Coffee Platform', companyType: 'PLATFORM' },
  ];

  const hashedPassword = bcryptSync.hashSync('password123', 10);

  demoData.forEach((d) => {
    const companyId = uuidv4();
    db.prepare('INSERT INTO companies (id, name, type, email) VALUES (?, ?, ?, ?)').run(companyId, d.company, d.companyType, d.email);
    const userId = uuidv4();
    db.prepare('INSERT INTO users (id, email, password, name, role, companyId) VALUES (?, ?, ?, ?, ?, ?)').run(userId, d.email, hashedPassword, d.name, d.role, companyId);
    console.log(`  ✅ Created ${d.role}: ${d.email}`);
  });
}

// ── Auth Middleware ──────────────────────────────────────────

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'Token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
}

// ── Routes ──────────────────────────────────────────────────

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, companyName, companyType } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const companyId = uuidv4();
    db.prepare(`
      INSERT INTO companies (id, name, type, email)
      VALUES (?, ?, ?, ?)
    `).run(companyId, companyName || `${name}'s Company`, companyType || 'CAFE_CHAIN', email);

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    db.prepare(`
      INSERT INTO users (id, email, password, name, role, companyId)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email, hashedPassword, name, role || 'BUYER', companyId);

    const token = jwt.sign(
      { userId, email, role: role || 'BUYER', companyId },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      success: true,
      data: { token, user: { id: userId, email, name, role: role || 'BUYER', companyId } },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(user.companyId) as any;

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, companyId: user.companyId },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          avatar: user.avatar,
        },
        company: company,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get current user profile
app.get('/api/users/me', authenticateToken, (req: any, res) => {
  const user = db.prepare('SELECT id, email, name, role, companyId, avatar, phone, isActive, createdAt FROM users WHERE id = ?').get(req.user.userId) as any;
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(user.companyId);
  res.json({ success: true, data: { ...user, company } });
});

// List all users (admin)
app.get('/api/users', authenticateToken, (req: any, res) => {
  const users = db.prepare('SELECT id, email, name, role, companyId, avatar, isActive, createdAt FROM users').all();
  res.json({ success: true, data: users });
});

// List companies
app.get('/api/companies', authenticateToken, (_req, res) => {
  const companies = db.prepare('SELECT * FROM companies').all();
  res.json({ success: true, data: companies });
});

// Get company by ID
app.get('/api/companies/:id', authenticateToken, (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
  res.json({ success: true, data: company });
});

// ── Start Server ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🔐 User Service running on port ${PORT}`);
});

export default app;
