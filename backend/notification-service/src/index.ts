// ═══════════════════════════════════════════════════════════════
// Notification Service — Event Consumer & Push Notifications
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  EventBus, EventType,
  type RFQSubmittedPayload, type QuoteSubmittedPayload,
  type POCreatedPayload, type POStatusChangedPayload,
  type InventoryLockedPayload, type ChatMessagePayload,
} from '@b2b-coffee/event-schemas';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4005;
const eventBus = EventBus.getInstance();

// ── In-memory notification store ─────────────────────────────
interface Notification {
  id: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

const notifications: Notification[] = [];

// ── Event Subscriptions ──────────────────────────────────────

eventBus.subscribe<RFQSubmittedPayload>(EventType.RFQ_SUBMITTED, async (event) => {
  const { rfqId, buyerCompanyName, itemCount, totalQuantity } = event.payload;
  const notification: Notification = {
    id: uuidv4(), type: 'RFQ_RECEIVED',
    title: '📋 Yêu cầu báo giá mới',
    message: `${buyerCompanyName || 'Buyer'} gửi RFQ mới: ${itemCount} mặt hàng, tổng ${totalQuantity}kg`,
    data: { rfqId }, read: false, createdAt: new Date().toISOString(),
  };
  notifications.push(notification);
  console.log(`[Notification] 📋 RFQ submitted: ${rfqId}`);
});

eventBus.subscribe<QuoteSubmittedPayload>(EventType.QUOTE_SUBMITTED, async (event) => {
  const { quoteId, rfqId, supplierCompanyName, totalAmount } = event.payload;
  notifications.push({
    id: uuidv4(), type: 'QUOTE_RECEIVED',
    title: '💰 Báo giá mới',
    message: `${supplierCompanyName || 'Supplier'} gửi báo giá $${totalAmount.toLocaleString()} cho RFQ`,
    data: { quoteId, rfqId }, read: false, createdAt: new Date().toISOString(),
  });
  console.log(`[Notification] 💰 Quote submitted: ${quoteId} for RFQ ${rfqId}`);
});

eventBus.subscribe<POCreatedPayload>(EventType.PO_CREATED, async (event) => {
  const { poId, poNumber, totalAmount, items } = event.payload;
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  notifications.push({
    id: uuidv4(), type: 'ORDER_CREATED',
    title: '📦 Đơn hàng mới',
    message: `${poNumber} — ${totalQty}kg cà phê, tổng $${totalAmount.toLocaleString()}. Chuẩn bị xử lý!`,
    data: { poId, poNumber }, read: false, createdAt: new Date().toISOString(),
  });
  console.log(`[Notification] 📦 PO created: ${poNumber}`);
});

eventBus.subscribe<POStatusChangedPayload>(EventType.PO_STATUS_CHANGED, async (event) => {
  const { poNumber, previousStatus, newStatus } = event.payload;
  notifications.push({
    id: uuidv4(), type: 'ORDER_STATUS_CHANGED',
    title: '🔄 Cập nhật trạng thái đơn',
    message: `${poNumber}: ${previousStatus} → ${newStatus}`,
    data: { ...event.payload }, read: false, createdAt: new Date().toISOString(),
  });
  console.log(`[Notification] 🔄 PO ${poNumber}: ${previousStatus} → ${newStatus}`);
});

eventBus.subscribe<InventoryLockedPayload>(EventType.INVENTORY_LOCKED, async (event) => {
  const { sku, quantity, poId } = event.payload;
  notifications.push({
    id: uuidv4(), type: 'INVENTORY_LOCKED',
    title: '🔒 Tồn kho đã khóa',
    message: `Đã lock ${quantity}kg ${sku} cho đơn hàng`,
    data: { ...event.payload }, read: false, createdAt: new Date().toISOString(),
  });
  console.log(`[Notification] 🔒 Inventory locked: ${quantity}kg ${sku}`);
});

eventBus.subscribe<ChatMessagePayload>(EventType.CHAT_MESSAGE_SENT, async (event) => {
  const { senderName, content, rfqId } = event.payload;
  notifications.push({
    id: uuidv4(), type: 'CHAT_MESSAGE',
    title: '💬 Tin nhắn mới',
    message: `${senderName}: ${content.slice(0, 100)}...`,
    data: { ...event.payload }, read: false, createdAt: new Date().toISOString(),
  });
});

// ── REST Routes ──────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service', timestamp: new Date().toISOString() });
});

// List notifications
app.get('/api/notifications', (req, res) => {
  const { userId, unreadOnly, limit = '50' } = req.query;
  let result = [...notifications].reverse();
  if (unreadOnly === 'true') result = result.filter((n) => !n.read);
  result = result.slice(0, Number(limit));
  res.json({ success: true, data: result, total: notifications.length, unread: notifications.filter((n) => !n.read).length });
});

// Mark as read
app.patch('/api/notifications/:id/read', (req, res) => {
  const notification = notifications.find((n) => n.id === req.params.id);
  if (!notification) return res.status(404).json({ success: false, error: 'Not found' });
  notification.read = true;
  res.json({ success: true, data: notification });
});

// Mark all as read
app.post('/api/notifications/read-all', (_req, res) => {
  notifications.forEach((n) => (n.read = true));
  res.json({ success: true, message: 'All notifications marked as read' });
});

// Get event log (for admin dashboard)
app.get('/api/events', (_req, res) => {
  const events = eventBus.getRecentEvents(100);
  res.json({ success: true, data: events });
});

// Allow other microservices to forward events here for Admin visualization
app.post('/api/events/webhook', (req, res) => {
  const event = req.body;
  if (event.source !== 'notification-service') {
    // We only push to the log, avoiding re-publishing which might cause infinite loops if not careful
    // But since it's notification-service, publishing triggers our Slack/UI notification handlers!
    eventBus.publish({ ...event, source: 'notification-service' }); 
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
});

export default app;
