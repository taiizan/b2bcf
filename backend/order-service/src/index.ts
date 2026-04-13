// ═══════════════════════════════════════════════════════════════
// Order Service — Purchase Orders & Transaction Lock
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import { DatabaseSync as Database } from 'node:sqlite';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import {
  EventBus, EventType, createEvent,
  type POCreatedPayload, type POStatusChangedPayload, type InventoryLockedPayload,
} from '@b2b-coffee/event-schemas';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4003;
const eventBus = EventBus.getInstance();

const dbPath = path.join(__dirname, '..', 'data', 'orders.db');
const db = new Database(dbPath);

// ── PO Counter ───────────────────────────────────────────────
function getNextPONumber(): string {
  const year = new Date().getFullYear();
  const count = (db.prepare("SELECT COUNT(*) as c FROM purchase_orders WHERE poNumber LIKE ?").get(`PO-${year}%`) as any).c;
  return `PO-${year}-${String(count + 1).padStart(3, '0')}`;
}

// ── Routes ──────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'order-service', timestamp: new Date().toISOString() });
});

// List purchase orders
app.get('/api/orders', (req, res) => {
  try {
    const { status, buyerId, supplierId, page = '1', limit = '20' } = req.query;
    let query = 'SELECT * FROM purchase_orders WHERE 1=1';
    const params: any[] = [];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (buyerId) { query += ' AND buyerId = ?'; params.push(buyerId); }
    if (supplierId) { query += ' AND supplierId = ?'; params.push(supplierId); }

    const total = (db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params) as any).count;
    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const orders = db.prepare(query).all(...params);
    const ordersWithItems = (orders as any[]).map((o) => {
      o.items = db.prepare('SELECT * FROM po_items WHERE poId = ?').all(o.id);
      o.timeline = db.prepare('SELECT * FROM order_timeline WHERE poId = ? ORDER BY createdAt').all(o.id);
      return o;
    });

    res.json({
      success: true, data: ordersWithItems,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get PO by ID
app.get('/api/orders/:id', (req, res) => {
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id) as any;
  if (!po) return res.status(404).json({ success: false, error: 'Order not found' });
  po.items = db.prepare('SELECT * FROM po_items WHERE poId = ?').all(po.id);
  po.timeline = db.prepare('SELECT * FROM order_timeline WHERE poId = ? ORDER BY createdAt').all(po.id);
  res.json({ success: true, data: po });
});

// Create Purchase Order (from accepted quote or direct)
app.post('/api/orders', async (req, res) => {
  try {
    const { rfqId, quoteId, buyerId, supplierId, items, deliveryAddress, deliveryTerms, paymentTerms, expectedDelivery } = req.body;
    const poId = `po-${uuidv4().slice(0, 8)}`;
    const poNumber = getNextPONumber();

    const subtotal = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0);
    const tax = subtotal * 0.1;
    const shippingCost = subtotal > 5000 ? 0 : 200;
    const totalAmount = subtotal + tax + shippingCost;

    db.prepare(`INSERT INTO purchase_orders (id, poNumber, rfqId, quoteId, buyerId, supplierId, status, subtotal, tax, shippingCost, totalAmount, deliveryAddress, deliveryTerms, paymentTerms, expectedDelivery)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(poId, poNumber, rfqId || null, quoteId || null, buyerId, supplierId, subtotal, tax, shippingCost, totalAmount, deliveryAddress || '', deliveryTerms || 'FOB', paymentTerms || 'Net 30', expectedDelivery || null);

    const insertItem = db.prepare('INSERT INTO po_items (id, poId, productId, sku, name, variety, quantity, unit, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    items.forEach((item: any) => {
      insertItem.run(uuidv4(), poId, item.productId, item.sku, item.name, item.variety || '', item.quantity, item.unit || 'KG', item.unitPrice, item.quantity * item.unitPrice);
    });

    // Add timeline entry
    db.prepare('INSERT INTO order_timeline (id, poId, status, note, userId) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), poId, 'PENDING', 'Đơn hàng được tạo', req.body.userId || 'system');

    // Publish PO_CREATED event
    await eventBus.publish(createEvent<POCreatedPayload>(EventType.PO_CREATED, 'order-service', {
      poId, poNumber, rfqId, quoteId, buyerId, supplierId, totalAmount,
      items: items.map((i: any) => ({ productId: i.productId, sku: i.sku, quantity: i.quantity, unitPrice: i.unitPrice })),
    }));

    // Publish INVENTORY_LOCKED for each item
    for (const item of items) {
      await eventBus.publish(createEvent<InventoryLockedPayload>(EventType.INVENTORY_LOCKED, 'order-service', {
        productId: item.productId, sku: item.sku, quantity: item.quantity, poId, supplierId,
      }));
    }

    res.status(201).json({ success: true, data: { id: poId, poNumber, totalAmount } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update PO status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, note, userId } = req.body;
    const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(req.params.id) as any;
    if (!po) return res.status(404).json({ success: false, error: 'Order not found' });

    const previousStatus = po.status;
    db.prepare('UPDATE purchase_orders SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?').run(status, po.id);
    db.prepare('INSERT INTO order_timeline (id, poId, status, note, userId) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), po.id, status, note || `Trạng thái chuyển sang ${status}`, userId || 'system');

    await eventBus.publish(createEvent<POStatusChangedPayload>(EventType.PO_STATUS_CHANGED, 'order-service', {
      poId: po.id, poNumber: po.poNumber, previousStatus, newStatus: status, updatedBy: userId || 'system',
    }));

    res.json({ success: true, data: { message: 'Status updated', previousStatus, newStatus: status } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`📦 Order Service running on port ${PORT}`);
});

export default app;
