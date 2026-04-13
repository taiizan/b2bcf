// ═══════════════════════════════════════════════════════════════
// RFQ Service — Request for Quotation & Quote Management
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import { DatabaseSync as Database } from 'node:sqlite';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import {
  EventBus,
  EventType,
  createEvent,
  type RFQSubmittedPayload,
  type QuoteSubmittedPayload,
  type QuoteAcceptedPayload,
  type POCreatedPayload,
} from '@b2b-coffee/event-schemas';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const eventBus = EventBus.getInstance();

// ── Database ─────────────────────────────────────────────────
const dbPath = path.join(__dirname, '..', 'data', 'rfq.db');
const db = new Database(dbPath);

// ── Event Subscriptions ──────────────────────────────────────

// Auto-close RFQ when PO is created from its quote
eventBus.subscribe<POCreatedPayload>(EventType.PO_CREATED, async (event) => {
  const { rfqId } = event.payload;
  if (rfqId) {
    db.prepare('UPDATE rfqs SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?')
      .run('CLOSED', rfqId);
    console.log(`[RFQ Service] 📦 RFQ ${rfqId} closed — PO created`);
  }
});

// ── Routes: Products (Catalog) ───────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rfq-service', timestamp: new Date().toISOString() });
});

// List products with filtering
app.get('/api/products', (req, res) => {
  try {
    const { variety, origin, minPrice, maxPrice, search, page = '1', limit = '20' } = req.query;
    let query = 'SELECT * FROM products WHERE isActive = 1';
    const params: any[] = [];

    if (variety) { query += ' AND variety = ?'; params.push(variety); }
    if (origin) { query += ' AND origin LIKE ?'; params.push(`%${origin}%`); }
    if (minPrice) { query += ' AND basePrice >= ?'; params.push(Number(minPrice)); }
    if (maxPrice) { query += ' AND basePrice <= ?'; params.push(Number(maxPrice)); }
    if (search) { query += ' AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const total = (db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params) as any).count;
    const offset = (Number(page) - 1) * Number(limit);
    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const products = db.prepare(query).all(...params);

    // Attach price tiers
    const productsWithTiers = (products as any[]).map((p) => {
      const tiers = db.prepare('SELECT * FROM price_tiers WHERE productId = ? ORDER BY minQty').all(p.id);
      return { ...p, priceTiers: tiers };
    });

    res.json({
      success: true,
      data: productsWithTiers,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get product by ID or SKU
app.get('/api/products/:idOrSku', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ? OR sku = ?').get(req.params.idOrSku, req.params.idOrSku) as any;
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  const tiers = db.prepare('SELECT * FROM price_tiers WHERE productId = ? ORDER BY minQty').all(product.id);
  res.json({ success: true, data: { ...product, priceTiers: tiers } });
});

// ── Routes: RFQ ──────────────────────────────────────────────

// List RFQs (filtered by role)
app.get('/api/rfqs', (req, res) => {
  try {
    const { status, buyerId, page = '1', limit = '20' } = req.query;
    let query = 'SELECT * FROM rfqs WHERE 1=1';
    const params: any[] = [];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (buyerId) { query += ' AND buyerId = ?'; params.push(buyerId); }

    const total = (db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count')).get(...params) as any).count;
    query += ` ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const rfqs = db.prepare(query).all(...params);
    const rfqsWithItems = (rfqs as any[]).map((r) => {
      const items = db.prepare('SELECT * FROM rfq_items WHERE rfqId = ?').all(r.id);
      return { ...r, items };
    });

    res.json({
      success: true,
      data: rfqsWithItems,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get RFQ by ID
app.get('/api/rfqs/:id', (req, res) => {
  const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(req.params.id) as any;
  if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
  rfq.items = db.prepare('SELECT * FROM rfq_items WHERE rfqId = ?').all(rfq.id);
  rfq.quotes = db.prepare('SELECT * FROM quotes WHERE rfqId = ?').all(rfq.id);
  (rfq.quotes as any[]).forEach((q: any) => {
    q.items = db.prepare('SELECT * FROM quote_items WHERE quoteId = ?').all(q.id);
  });
  res.json({ success: true, data: rfq });
});

// Create RFQ
app.post('/api/rfqs', async (req, res) => {
  try {
    const { buyerId, buyerContactId, title, items, notes, deadline } = req.body;
    const rfqId = `rfq-${uuidv4().slice(0, 8)}`;

    db.prepare('INSERT INTO rfqs (id, buyerId, buyerContactId, title, status, notes, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(rfqId, buyerId, buyerContactId, title, 'SUBMITTED', notes, deadline);

    const insertItem = db.prepare('INSERT INTO rfq_items (id, rfqId, variety, processing, origin, quantity, unit, targetPrice, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    items.forEach((item: any) => {
      insertItem.run(uuidv4(), rfqId, item.variety, item.processing, item.origin, item.quantity, item.unit || 'KG', item.targetPrice, item.notes);
    });

    // Publish event
    const totalQty = items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    await eventBus.publish(createEvent<RFQSubmittedPayload>(EventType.RFQ_SUBMITTED, 'rfq-service', {
      rfqId, buyerId, buyerCompanyName: '', itemCount: items.length, totalQuantity: totalQty, deadline,
    }));

    const createdRfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(rfqId);
    res.status(201).json({ success: true, data: createdRfq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update RFQ (Buyer action)
app.put('/api/rfqs/:id', async (req, res) => {
  try {
    const { title, deadline, notes, items } = req.body;
    const rfqId = req.params.id;
    
    const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(rfqId) as any;
    if (!rfq) return res.status(404).json({ success: false, error: 'RFQ not found' });
    if (rfq.status !== 'SUBMITTED') return res.status(400).json({ success: false, error: 'Cannot edit RFQ that has been assigned a status.' });

    db.prepare('UPDATE rfqs SET title = ?, deadline = ?, notes = ?, updatedAt = datetime(\'now\') WHERE id = ?')
      .run(title, deadline, notes, rfqId);

    if (items && items.length > 0) {
      const firstItem = items[0];
      const existingItem = db.prepare('SELECT id FROM rfq_items WHERE rfqId = ? LIMIT 1').get(rfqId) as any;
      if (existingItem) {
        db.prepare('UPDATE rfq_items SET variety = ?, processing = ?, origin = ?, quantity = ?, targetPrice = ? WHERE id = ?')
          .run(firstItem.variety, firstItem.processing, firstItem.origin, firstItem.quantity, firstItem.targetPrice, existingItem.id);
      }
    }

    res.json({ success: true, data: { id: rfqId } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Routes: Quotes ───────────────────────────────────────────

// Submit quote for an RFQ (supplier action)
app.post('/api/quotes', async (req, res) => {
  try {
    const { rfqId, supplierId, supplierContactId, items, validUntil, notes, deliveryTerms, paymentTerms } = req.body;
    const quoteId = `quote-${uuidv4().slice(0, 8)}`;

    const totalAmount = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0);

    db.prepare('INSERT INTO quotes (id, rfqId, supplierId, supplierContactId, status, totalAmount, validUntil, notes, deliveryTerms, paymentTerms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(quoteId, rfqId, supplierId, supplierContactId, 'SUBMITTED', totalAmount, validUntil, notes, deliveryTerms || 'FOB Ho Chi Minh', paymentTerms || 'Net 30');

    const insertQI = db.prepare('INSERT INTO quote_items (id, quoteId, rfqItemId, productId, quantity, unit, unitPrice, totalPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    items.forEach((item: any) => {
      insertQI.run(uuidv4(), quoteId, item.rfqItemId, item.productId, item.quantity, item.unit || 'KG', item.unitPrice, item.quantity * item.unitPrice);
    });

    // Update RFQ status
    db.prepare('UPDATE rfqs SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?').run('QUOTED', rfqId);

    // Publish event
    await eventBus.publish(createEvent<QuoteSubmittedPayload>(EventType.QUOTE_SUBMITTED, 'rfq-service', {
      quoteId, rfqId, supplierId, supplierCompanyName: '', totalAmount, validUntil,
    }));

    res.status(201).json({ success: true, data: { id: quoteId, totalAmount } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Accept a quote
app.post('/api/quotes/:id/accept', async (req, res) => {
  try {
    const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id) as any;
    if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });

    db.prepare('UPDATE quotes SET status = ? WHERE id = ?').run('ACCEPTED', quote.id);
    db.prepare('UPDATE rfqs SET status = ?, updatedAt = datetime(\'now\') WHERE id = ?').run('ACCEPTED', quote.rfqId);

    // Reject other quotes for this RFQ
    db.prepare('UPDATE quotes SET status = ? WHERE rfqId = ? AND id != ?').run('REJECTED', quote.rfqId, quote.id);

    // Publish event
    const rfq = db.prepare('SELECT * FROM rfqs WHERE id = ?').get(quote.rfqId) as any;
    await eventBus.publish(createEvent<QuoteAcceptedPayload>(EventType.QUOTE_ACCEPTED, 'rfq-service', {
      quoteId: quote.id, rfqId: quote.rfqId, buyerId: rfq?.buyerId, supplierId: quote.supplierId, totalAmount: quote.totalAmount,
    }));

    res.json({ success: true, data: { message: 'Quote accepted', quoteId: quote.id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List quotes for an RFQ
app.get('/api/rfqs/:rfqId/quotes', (req, res) => {
  const quotes = db.prepare('SELECT * FROM quotes WHERE rfqId = ?').all(req.params.rfqId);
  (quotes as any[]).forEach((q: any) => {
    q.items = db.prepare('SELECT * FROM quote_items WHERE quoteId = ?').all(q.id);
  });
  res.json({ success: true, data: quotes });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`📋 RFQ Service running on port ${PORT}`);
});

export default app;
