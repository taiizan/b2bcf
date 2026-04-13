// ═══════════════════════════════════════════════════════════════
// B2B Coffee Wholesale — Shared Type Definitions
// ═══════════════════════════════════════════════════════════════

// ── Enums ────────────────────────────────────────────────────

export enum CoffeeVariety {
  ARABICA = 'ARABICA',
  ROBUSTA = 'ROBUSTA',
  FINE_ROBUSTA = 'FINE_ROBUSTA',
  LIBERICA = 'LIBERICA',
  EXCELSA = 'EXCELSA',
}

export enum CoffeeProcessing {
  WASHED = 'WASHED',
  NATURAL = 'NATURAL',
  HONEY = 'HONEY',
  WET_HULLED = 'WET_HULLED',
}

export enum Unit {
  KG = 'KG',
  BAG_60KG = 'BAG_60KG',
  TON = 'TON',
  CARTON = 'CARTON',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  BUYER = 'BUYER',
  SUPPLIER = 'SUPPLIER',
}

export enum CompanyType {
  ROASTER = 'ROASTER',           // Xưởng rang
  FARM = 'FARM',                 // Nông trại
  CAFE_CHAIN = 'CAFE_CHAIN',     // Chuỗi quán cafe
  RESTAURANT = 'RESTAURANT',     // Nhà hàng
  DISTRIBUTOR = 'DISTRIBUTOR',   // Nhà phân phối
}

export enum RFQStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  QUOTING = 'QUOTING',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED',
}

export enum QuoteStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  ROASTING = 'ROASTING',
  QUALITY_CHECK = 'QUALITY_CHECK',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  RFQ_RECEIVED = 'RFQ_RECEIVED',
  QUOTE_RECEIVED = 'QUOTE_RECEIVED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  INVENTORY_LOW = 'INVENTORY_LOW',
  PRICE_ALERT = 'PRICE_ALERT',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  SAMPLE_REQUEST = 'SAMPLE_REQUEST',
}

// ── Core Entities ────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  address: string;
  country: string;
  phone: string;
  email: string;
  taxId?: string;
  rating: number;       // 0-5
  verified: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatar?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CoffeeProduct {
  id: string;
  sku: string;
  name: string;
  variety: CoffeeVariety;
  processing: CoffeeProcessing;
  origin: string;        // Country / Region
  altitude?: string;     // e.g., "1200-1600m"
  harvestYear: number;
  grade: string;         // e.g., "Grade 1", "Specialty 82+"
  cuppingScore?: number; // 0-100
  description: string;
  images: string[];
  supplierId: string;    // Company ID

  // Pricing & inventory
  basePrice: number;     // USD per KG
  unit: Unit;
  moq: number;           // Minimum Order Quantity
  availableStock: number;
  lockedStock: number;   // Reserved by pending POs

  // Volume pricing tiers
  priceTiers: PriceTier[];

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  pricePerUnit: number;
  unit: Unit;
}

// ── RFQ (Request for Quotation) ──────────────────────────────

export interface RFQ {
  id: string;
  buyerId: string;       // Company ID
  buyerContactId: string; // User ID
  title: string;
  status: RFQStatus;
  items: RFQItem[];
  notes?: string;
  attachments: string[];
  deadline: string;      // ISO date
  createdAt: string;
  updatedAt: string;
}

export interface RFQItem {
  id: string;
  rfqId: string;
  variety: CoffeeVariety;
  processing?: CoffeeProcessing;
  origin?: string;
  quantity: number;
  unit: Unit;
  targetPrice?: number;  // Buyer's target price
  notes?: string;
}

// ── Quote (Supplier Response to RFQ) ─────────────────────────

export interface Quote {
  id: string;
  rfqId: string;
  supplierId: string;    // Company ID
  supplierContactId: string; // User ID
  status: QuoteStatus;
  items: QuoteItem[];
  totalAmount: number;
  currency: string;
  validUntil: string;    // ISO date
  notes?: string;
  deliveryTerms: string;
  paymentTerms: string;
  createdAt: string;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  rfqItemId: string;
  productId: string;     // CoffeeProduct ID
  quantity: number;
  unit: Unit;
  unitPrice: number;
  totalPrice: number;
}

// ── Purchase Order ───────────────────────────────────────────

export interface PurchaseOrder {
  id: string;
  poNumber: string;      // e.g., "PO-2024-001"
  rfqId?: string;
  quoteId?: string;
  buyerId: string;       // Company ID
  supplierId: string;    // Company ID
  status: OrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  deliveryTerms: string;
  paymentTerms: string;
  expectedDelivery: string;
  timeline: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  productId: string;
  sku: string;
  name: string;
  variety: CoffeeVariety;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderTimeline {
  id: string;
  poId: string;
  status: OrderStatus;
  note: string;
  userId: string;
  createdAt: string;
}

// ── Chat & Negotiation ───────────────────────────────────────

export interface ChatRoom {
  id: string;
  rfqId: string;
  participants: string[]; // User IDs
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'price_offer' | 'sample_request' | 'attachment';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Notifications ────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

// ── AI / Market Data ─────────────────────────────────────────

export interface PriceForecast {
  variety: CoffeeVariety;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;     // 0..1
  trend: 'up' | 'down' | 'stable';
  period: string;         // e.g., "2024-Q2"
}

export interface MarketInsight {
  id: string;
  title: string;
  summary: string;
  variety: CoffeeVariety;
  region: string;
  impact: 'high' | 'medium' | 'low';
  createdAt: string;
}

// ── API Response Wrappers ────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, string[]>;
}
