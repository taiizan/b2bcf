// ═══════════════════════════════════════════════════════════════
// B2B Coffee Wholesale — Event Schemas & In-Memory Event Bus
// ═══════════════════════════════════════════════════════════════

import { v4 as uuidv4 } from 'uuid';

// ── Event Types ──────────────────────────────────────────────

export enum EventType {
  // RFQ Events
  RFQ_SUBMITTED = 'RFQ_SUBMITTED',
  RFQ_UPDATED = 'RFQ_UPDATED',
  RFQ_CLOSED = 'RFQ_CLOSED',

  // Quote Events
  QUOTE_SUBMITTED = 'QUOTE_SUBMITTED',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',

  // Order Events
  PO_CREATED = 'PO_CREATED',
  PO_STATUS_CHANGED = 'PO_STATUS_CHANGED',
  PO_CANCELLED = 'PO_CANCELLED',

  // Inventory Events
  INVENTORY_LOCKED = 'INVENTORY_LOCKED',
  INVENTORY_RELEASED = 'INVENTORY_RELEASED',
  INVENTORY_LOW = 'INVENTORY_LOW',

  // Price Events
  PRICE_UPDATED = 'PRICE_UPDATED',
  PRICE_ALERT = 'PRICE_ALERT',

  // Chat Events
  CHAT_MESSAGE_SENT = 'CHAT_MESSAGE_SENT',
  SAMPLE_REQUESTED = 'SAMPLE_REQUESTED',

  // Notification Events
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
}

// ── Event Envelope ───────────────────────────────────────────

export interface DomainEvent<T = unknown> {
  id: string;
  type: EventType;
  source: string;        // Service that produced it
  timestamp: string;
  correlationId?: string; // For tracing across services
  payload: T;
}

// ── Event Payloads ───────────────────────────────────────────

export interface RFQSubmittedPayload {
  rfqId: string;
  buyerId: string;
  buyerCompanyName: string;
  itemCount: number;
  totalQuantity: number;
  deadline: string;
}

export interface QuoteSubmittedPayload {
  quoteId: string;
  rfqId: string;
  supplierId: string;
  supplierCompanyName: string;
  totalAmount: number;
  validUntil: string;
}

export interface QuoteAcceptedPayload {
  quoteId: string;
  rfqId: string;
  buyerId: string;
  supplierId: string;
  totalAmount: number;
}

export interface POCreatedPayload {
  poId: string;
  poNumber: string;
  rfqId?: string;
  quoteId?: string;
  buyerId: string;
  supplierId: string;
  totalAmount: number;
  items: Array<{
    productId: string;
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface POStatusChangedPayload {
  poId: string;
  poNumber: string;
  previousStatus: string;
  newStatus: string;
  updatedBy: string;
}

export interface InventoryLockedPayload {
  productId: string;
  sku: string;
  quantity: number;
  poId: string;
  supplierId: string;
}

export interface PriceUpdatedPayload {
  productId: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  supplierId: string;
}

export interface ChatMessagePayload {
  roomId: string;
  rfqId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'price_offer' | 'sample_request';
}

// ── Event Factory ────────────────────────────────────────────

export function createEvent<T>(
  type: EventType,
  source: string,
  payload: T,
  correlationId?: string,
): DomainEvent<T> {
  return {
    id: uuidv4(),
    type,
    source,
    timestamp: new Date().toISOString(),
    correlationId: correlationId || uuidv4(),
    payload,
  };
}

// ── Event Handler Type ───────────────────────────────────────

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>;

// ── In-Memory Event Bus ──────────────────────────────────────
// Local development replacement for RabbitMQ / Kafka

export class EventBus {
  private static instance: EventBus;
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private eventLog: DomainEvent[] = [];

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe<T>(eventType: EventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);
    console.log(`[EventBus] ✅ Subscribed to ${eventType}`);
  }

  async publish<T>(event: DomainEvent<T>): Promise<void> {
    this.eventLog.push(event as DomainEvent);
    console.log(
      `[EventBus] 📤 Event published: ${event.type} from ${event.source} (${event.id})`,
    );

    // Broadcast across microservices for Admin Dashboard visibility
    if (event.source !== 'notification-service') {
      const webhookUrl = process.env.NOTIFICATION_SERVICE_URL
        ? `${process.env.NOTIFICATION_SERVICE_URL}/api/events/webhook`
        : 'http://localhost:4005/api/events/webhook';

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => { /* mute error */ });
    }

    const handlers = this.handlers.get(event.type) || [];
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(event as DomainEvent)),
    );

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `[EventBus] ❌ Handler ${i} for ${event.type} failed:`,
          result.reason,
        );
      }
    });
  }

  getEventLog(): DomainEvent[] {
    return [...this.eventLog];
  }

  getRecentEvents(limit = 50): DomainEvent[] {
    return this.eventLog.slice(-limit);
  }

  clearLog(): void {
    this.eventLog = [];
  }
}

export default EventBus;
