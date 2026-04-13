// ═══════════════════════════════════════════════════════════════
// Seed Script — Populates all services with realistic coffee data
// ═══════════════════════════════════════════════════════════════

import { DatabaseSync as Database } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Ensure data directories exist
const services = ['user-service', 'rfq-service', 'order-service', 'notification-service', 'ai-service'];
services.forEach((svc) => {
  const dataDir = path.join(__dirname, '..', '..', svc, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
});

// ── User Service DB ──────────────────────────────────────────
const userDb = new Database(path.join(__dirname, '..', 'data', 'users.db'));

userDb.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL,
    address TEXT DEFAULT '', country TEXT DEFAULT 'Vietnam',
    phone TEXT DEFAULT '', email TEXT DEFAULT '', taxId TEXT,
    rating REAL DEFAULT 0, verified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
    name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'BUYER',
    companyId TEXT NOT NULL, avatar TEXT, phone TEXT,
    isActive INTEGER DEFAULT 1, createdAt TEXT DEFAULT (datetime('now'))
  );
`);

// Companies
const companies = [
  { id: 'comp-01', name: 'Highland Coffee Chain', type: 'CAFE_CHAIN', country: 'Vietnam', rating: 4.5, verified: 1 },
  { id: 'comp-02', name: 'Trung Nguyên Legend', type: 'ROASTER', country: 'Vietnam', rating: 4.8, verified: 1 },
  { id: 'comp-03', name: 'Đắk Lắk Green Farm', type: 'FARM', country: 'Vietnam', rating: 4.3, verified: 1 },
  { id: 'comp-04', name: 'The Coffee House', type: 'CAFE_CHAIN', country: 'Vietnam', rating: 4.6, verified: 1 },
  { id: 'comp-05', name: 'Lâm Đồng Premium Roasters', type: 'ROASTER', country: 'Vietnam', rating: 4.7, verified: 1 },
  { id: 'comp-06', name: 'Saigon Coffee Corp', type: 'DISTRIBUTOR', country: 'Vietnam', rating: 4.2, verified: 1 },
];

const hashedPassword = bcrypt.hashSync('password123', 10);

const users = [
  { id: 'user-01', email: 'buyer@highland.vn', name: 'Nguyễn Minh Tuấn', role: 'BUYER', companyId: 'comp-01' },
  { id: 'user-02', email: 'supplier@trungnguyên.vn', name: 'Trần Thị Hương', role: 'SUPPLIER', companyId: 'comp-02' },
  { id: 'user-03', email: 'farmer@daklak.vn', name: 'Phạm Văn Đức', role: 'SUPPLIER', companyId: 'comp-03' },
  { id: 'user-04', email: 'buyer@coffeehouse.vn', name: 'Lê Thanh Mai', role: 'BUYER', companyId: 'comp-04' },
  { id: 'user-05', email: 'supplier@lamdong.vn', name: 'Võ Hoàng Nam', role: 'SUPPLIER', companyId: 'comp-05' },
  { id: 'user-06', email: 'admin@b2bcoffee.vn', name: 'Admin Coffee Portal', role: 'ADMIN', companyId: 'comp-06' },
];

// Clear & insert
userDb.exec('DELETE FROM users; DELETE FROM companies;');
const insertCompany = userDb.prepare('INSERT INTO companies (id, name, type, country, rating, verified) VALUES (?, ?, ?, ?, ?, ?)');
companies.forEach((c) => insertCompany.run(c.id, c.name, c.type, c.country, c.rating, c.verified));

const insertUser = userDb.prepare('INSERT INTO users (id, email, password, name, role, companyId) VALUES (?, ?, ?, ?, ?, ?)');
users.forEach((u) => insertUser.run(u.id, u.email, hashedPassword, u.name, u.role, u.companyId));

console.log(`✅ User DB seeded: ${companies.length} companies, ${users.length} users`);

// ── RFQ Service DB ───────────────────────────────────────────
const rfqDb = new Database(path.join(__dirname, '..', '..', 'rfq-service', 'data', 'rfq.db'));

rfqDb.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
    variety TEXT NOT NULL, processing TEXT DEFAULT 'WASHED',
    origin TEXT DEFAULT 'Vietnam', altitude TEXT, harvestYear INTEGER,
    grade TEXT, cuppingScore REAL, description TEXT,
    supplierId TEXT NOT NULL, basePrice REAL NOT NULL,
    unit TEXT DEFAULT 'KG', moq REAL DEFAULT 100,
    availableStock REAL DEFAULT 0, lockedStock REAL DEFAULT 0,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS price_tiers (
    id TEXT PRIMARY KEY, productId TEXT NOT NULL,
    minQty REAL NOT NULL, maxQty REAL, pricePerUnit REAL NOT NULL,
    unit TEXT DEFAULT 'KG',
    FOREIGN KEY (productId) REFERENCES products(id)
  );
  CREATE TABLE IF NOT EXISTS rfqs (
    id TEXT PRIMARY KEY, buyerId TEXT NOT NULL, buyerContactId TEXT NOT NULL,
    title TEXT NOT NULL, status TEXT DEFAULT 'SUBMITTED',
    notes TEXT, deadline TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS rfq_items (
    id TEXT PRIMARY KEY, rfqId TEXT NOT NULL,
    variety TEXT NOT NULL, processing TEXT, origin TEXT,
    quantity REAL NOT NULL, unit TEXT DEFAULT 'KG',
    targetPrice REAL, notes TEXT,
    FOREIGN KEY (rfqId) REFERENCES rfqs(id)
  );
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY, rfqId TEXT NOT NULL,
    supplierId TEXT NOT NULL, supplierContactId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    totalAmount REAL DEFAULT 0, currency TEXT DEFAULT 'USD',
    validUntil TEXT, notes TEXT,
    deliveryTerms TEXT DEFAULT 'FOB Ho Chi Minh',
    paymentTerms TEXT DEFAULT 'Net 30',
    createdAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS quote_items (
    id TEXT PRIMARY KEY, quoteId TEXT NOT NULL,
    rfqItemId TEXT NOT NULL, productId TEXT NOT NULL,
    quantity REAL NOT NULL, unit TEXT DEFAULT 'KG',
    unitPrice REAL NOT NULL, totalPrice REAL NOT NULL,
    FOREIGN KEY (quoteId) REFERENCES quotes(id)
  );
`);

// Coffee Products
const products = [
  { id: 'prod-01', sku: 'ARB-DL-W01', name: 'Đắk Lắk Arabica Washed Grade 1', variety: 'ARABICA', processing: 'WASHED', origin: 'Đắk Lắk, Vietnam', altitude: '1200-1600m', harvestYear: 2024, grade: 'Grade 1', cuppingScore: 84, description: 'Premium washed Arabica from the central highlands of Đắk Lắk. Bright acidity, citrus notes with a clean finish.', supplierId: 'comp-03', basePrice: 8.50, moq: 100, availableStock: 15000, lockedStock: 2000 },
  { id: 'prod-02', sku: 'ROB-DL-N01', name: 'Đắk Lắk Robusta Natural', variety: 'ROBUSTA', processing: 'NATURAL', origin: 'Đắk Lắk, Vietnam', altitude: '600-800m', harvestYear: 2024, grade: 'Grade 1', cuppingScore: 78, description: 'Full-bodied natural processed Robusta. Bold chocolate and nutty profile, excellent for espresso blends.', supplierId: 'comp-03', basePrice: 4.20, moq: 500, availableStock: 45000, lockedStock: 5000 },
  { id: 'prod-03', sku: 'ARB-LD-H01', name: 'Lâm Đồng Arabica Honey', variety: 'ARABICA', processing: 'HONEY', origin: 'Lâm Đồng, Vietnam', altitude: '1400-1800m', harvestYear: 2024, grade: 'Specialty 82+', cuppingScore: 86, description: 'Honey processed specialty Arabica from Da Lat region. Sweet, fruity with caramel undertones.', supplierId: 'comp-05', basePrice: 12.00, moq: 50, availableStock: 5000, lockedStock: 500 },
  { id: 'prod-04', sku: 'FRB-DL-W01', name: 'Fine Robusta Washed Premium', variety: 'FINE_ROBUSTA', processing: 'WASHED', origin: 'Đắk Nông, Vietnam', altitude: '800-1000m', harvestYear: 2024, grade: 'Fine Robusta 80+', cuppingScore: 82, description: 'Exceptional washed Fine Robusta. Complex flavor with dark chocolate, spice notes. Great for specialty blends.', supplierId: 'comp-02', basePrice: 6.80, moq: 200, availableStock: 20000, lockedStock: 3000 },
  { id: 'prod-05', sku: 'ROB-GL-N01', name: 'Gia Lai Robusta Natural Bulk', variety: 'ROBUSTA', processing: 'NATURAL', origin: 'Gia Lai, Vietnam', altitude: '500-700m', harvestYear: 2024, grade: 'Grade 2', cuppingScore: 72, description: 'Commercial grade Robusta for instant coffee and large-volume blends. Consistent quality.', supplierId: 'comp-02', basePrice: 3.10, moq: 1000, availableStock: 100000, lockedStock: 15000 },
  { id: 'prod-06', sku: 'ARB-SL-W01', name: 'Sơn La Arabica Washed', variety: 'ARABICA', processing: 'WASHED', origin: 'Sơn La, Vietnam', altitude: '1000-1400m', harvestYear: 2024, grade: 'Grade 1', cuppingScore: 83, description: 'Northern highland Arabica with floral aroma, bright citric acidity, and lingering sweetness.', supplierId: 'comp-05', basePrice: 9.20, moq: 100, availableStock: 8000, lockedStock: 1000 },
];

rfqDb.exec('DELETE FROM quote_items; DELETE FROM quotes; DELETE FROM rfq_items; DELETE FROM rfqs; DELETE FROM price_tiers; DELETE FROM products;');

const insertProduct = rfqDb.prepare('INSERT INTO products (id, sku, name, variety, processing, origin, altitude, harvestYear, grade, cuppingScore, description, supplierId, basePrice, moq, availableStock, lockedStock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
products.forEach((p) => insertProduct.run(p.id, p.sku, p.name, p.variety, p.processing, p.origin, p.altitude, p.harvestYear, p.grade, p.cuppingScore, p.description, p.supplierId, p.basePrice, p.moq, p.availableStock, p.lockedStock));

// Price tiers
const tiers = [
  { productId: 'prod-01', tiers: [{ min: 100, max: 499, price: 8.50 }, { min: 500, max: 1999, price: 7.80 }, { min: 2000, max: null, price: 7.20 }] },
  { productId: 'prod-02', tiers: [{ min: 500, max: 1999, price: 4.20 }, { min: 2000, max: 9999, price: 3.80 }, { min: 10000, max: null, price: 3.40 }] },
  { productId: 'prod-03', tiers: [{ min: 50, max: 199, price: 12.00 }, { min: 200, max: 999, price: 10.80 }, { min: 1000, max: null, price: 9.60 }] },
  { productId: 'prod-04', tiers: [{ min: 200, max: 999, price: 6.80 }, { min: 1000, max: 4999, price: 6.20 }, { min: 5000, max: null, price: 5.60 }] },
  { productId: 'prod-05', tiers: [{ min: 1000, max: 4999, price: 3.10 }, { min: 5000, max: 19999, price: 2.80 }, { min: 20000, max: null, price: 2.50 }] },
  { productId: 'prod-06', tiers: [{ min: 100, max: 499, price: 9.20 }, { min: 500, max: 1999, price: 8.40 }, { min: 2000, max: null, price: 7.80 }] },
];

const insertTier = rfqDb.prepare('INSERT INTO price_tiers (id, productId, minQty, maxQty, pricePerUnit) VALUES (?, ?, ?, ?, ?)');
tiers.forEach((t) => t.tiers.forEach((tier, i) => {
  insertTier.run(uuidv4(), t.productId, tier.min, tier.max, tier.price);
}));

// Sample RFQs
const rfqs = [
  { id: 'rfq-01', buyerId: 'comp-01', buyerContactId: 'user-01', title: 'Yêu cầu báo giá 2 tấn Robusta Natural cho Q2/2024', status: 'QUOTING', deadline: '2024-04-15' },
  { id: 'rfq-02', buyerId: 'comp-04', buyerContactId: 'user-04', title: 'Sourcing 500kg Arabica Specialty cho menu mới', status: 'SUBMITTED', deadline: '2024-03-30' },
  { id: 'rfq-03', buyerId: 'comp-01', buyerContactId: 'user-01', title: 'Hợp đồng hàng năm — Fine Robusta blend', status: 'QUOTED', deadline: '2024-05-01' },
];

const insertRfq = rfqDb.prepare('INSERT INTO rfqs (id, buyerId, buyerContactId, title, status, deadline) VALUES (?, ?, ?, ?, ?, ?)');
rfqs.forEach((r) => insertRfq.run(r.id, r.buyerId, r.buyerContactId, r.title, r.status, r.deadline));

const rfqItems = [
  { id: uuidv4(), rfqId: 'rfq-01', variety: 'ROBUSTA', processing: 'NATURAL', quantity: 2000, unit: 'KG', targetPrice: 3.80 },
  { id: uuidv4(), rfqId: 'rfq-02', variety: 'ARABICA', processing: 'HONEY', quantity: 500, unit: 'KG', targetPrice: 10.50 },
  { id: uuidv4(), rfqId: 'rfq-03', variety: 'FINE_ROBUSTA', processing: 'WASHED', quantity: 5000, unit: 'KG', targetPrice: 6.00 },
  { id: uuidv4(), rfqId: 'rfq-03', variety: 'ROBUSTA', processing: 'NATURAL', quantity: 10000, unit: 'KG', targetPrice: 3.20 },
];

const insertRfqItem = rfqDb.prepare('INSERT INTO rfq_items (id, rfqId, variety, processing, quantity, unit, targetPrice) VALUES (?, ?, ?, ?, ?, ?, ?)');
rfqItems.forEach((i) => insertRfqItem.run(i.id, i.rfqId, i.variety, i.processing, i.quantity, i.unit, i.targetPrice));

// Sample Quotes
const insertQuote = rfqDb.prepare('INSERT INTO quotes (id, rfqId, supplierId, supplierContactId, status, totalAmount, validUntil, notes, deliveryTerms, paymentTerms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
insertQuote.run('quote-01', 'rfq-01', 'comp-03', 'user-03', 'SUBMITTED', 7600, '2024-04-10', 'Giá đã bao gồm đóng gói bao 60kg. Giao hàng trong 7 ngày.', 'FOB Buôn Ma Thuột', 'Net 30');
insertQuote.run('quote-02', 'rfq-03', 'comp-02', 'user-02', 'SUBMITTED', 62000, '2024-04-25', 'Giá ưu đãi cho hợp đồng năm. Bao gồm kiểm định chất lượng.', 'CIF Ho Chi Minh', 'Net 45');

console.log(`✅ RFQ DB seeded: ${products.length} products, ${rfqs.length} RFQs, 2 quotes`);

// ── Order Service DB ─────────────────────────────────────────
const orderDb = new Database(path.join(__dirname, '..', '..', 'order-service', 'data', 'orders.db'));

orderDb.exec(`
  CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY, poNumber TEXT NOT NULL UNIQUE,
    rfqId TEXT, quoteId TEXT,
    buyerId TEXT NOT NULL, supplierId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    subtotal REAL DEFAULT 0, tax REAL DEFAULT 0,
    shippingCost REAL DEFAULT 0, totalAmount REAL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    deliveryAddress TEXT DEFAULT '',
    deliveryTerms TEXT DEFAULT 'FOB',
    paymentTerms TEXT DEFAULT 'Net 30',
    expectedDelivery TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS po_items (
    id TEXT PRIMARY KEY, poId TEXT NOT NULL,
    productId TEXT NOT NULL, sku TEXT NOT NULL,
    name TEXT NOT NULL, variety TEXT,
    quantity REAL NOT NULL, unit TEXT DEFAULT 'KG',
    unitPrice REAL NOT NULL, totalPrice REAL NOT NULL,
    FOREIGN KEY (poId) REFERENCES purchase_orders(id)
  );
  CREATE TABLE IF NOT EXISTS order_timeline (
    id TEXT PRIMARY KEY, poId TEXT NOT NULL,
    status TEXT NOT NULL, note TEXT,
    userId TEXT, createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (poId) REFERENCES purchase_orders(id)
  );
`);

orderDb.exec('DELETE FROM order_timeline; DELETE FROM po_items; DELETE FROM purchase_orders;');

const insertPo = orderDb.prepare('INSERT INTO purchase_orders (id, poNumber, rfqId, quoteId, buyerId, supplierId, status, subtotal, tax, shippingCost, totalAmount, deliveryAddress, expectedDelivery) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
insertPo.run('po-01', 'PO-2024-001', 'rfq-01', 'quote-01', 'comp-01', 'comp-03', 'PROCESSING', 7600, 760, 200, 8560, 'Kho Highland, Q1, TP.HCM', '2024-04-20');
insertPo.run('po-02', 'PO-2024-002', null, null, 'comp-04', 'comp-05', 'ROASTING', 5400, 540, 150, 6090, 'The Coffee House, Q3, TP.HCM', '2024-04-25');

const insertPoItem = orderDb.prepare('INSERT INTO po_items (id, poId, productId, sku, name, variety, quantity, unit, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
insertPoItem.run(uuidv4(), 'po-01', 'prod-02', 'ROB-DL-N01', 'Đắk Lắk Robusta Natural', 'ROBUSTA', 2000, 'KG', 3.80, 7600);
insertPoItem.run(uuidv4(), 'po-02', 'prod-03', 'ARB-LD-H01', 'Lâm Đồng Arabica Honey', 'ARABICA', 500, 'KG', 10.80, 5400);

const insertTimeline = orderDb.prepare('INSERT INTO order_timeline (id, poId, status, note, userId) VALUES (?, ?, ?, ?, ?)');
insertTimeline.run(uuidv4(), 'po-01', 'PENDING', 'Đơn hàng được tạo từ báo giá', 'user-01');
insertTimeline.run(uuidv4(), 'po-01', 'CONFIRMED', 'Nhà cung cấp xác nhận đơn', 'user-03');
insertTimeline.run(uuidv4(), 'po-01', 'PROCESSING', 'Đang chuẩn bị hàng', 'user-03');
insertTimeline.run(uuidv4(), 'po-02', 'PENDING', 'Đặt hàng trực tiếp', 'user-04');
insertTimeline.run(uuidv4(), 'po-02', 'CONFIRMED', 'Xác nhận đơn', 'user-05');
insertTimeline.run(uuidv4(), 'po-02', 'PROCESSING', 'Chuẩn bị mẻ rang', 'user-05');
insertTimeline.run(uuidv4(), 'po-02', 'ROASTING', 'Đang rang xay theo yêu cầu', 'user-05');

console.log('✅ Order DB seeded: 2 purchase orders with timeline');

console.log('\n🎉 All databases seeded successfully!');
console.log('Credentials: password for all accounts is "password123"');
console.log('Accounts:');
users.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email}`));
