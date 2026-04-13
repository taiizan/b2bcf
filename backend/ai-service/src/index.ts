// ═══════════════════════════════════════════════════════════════
// AI Service — Coffee Price Forecasting & Market Insights
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { EventBus, EventType, type POCreatedPayload } from '@b2b-coffee/event-schemas';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4006;
const eventBus = EventBus.getInstance();

// ── Transaction Data Collection ──────────────────────────────
interface TransactionRecord {
  date: string;
  variety: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

const transactionHistory: TransactionRecord[] = [
  { date: '2024-01-15', variety: 'ROBUSTA', quantity: 5000, unitPrice: 3.40, totalAmount: 17000 },
  { date: '2024-01-22', variety: 'ARABICA', quantity: 1000, unitPrice: 8.20, totalAmount: 8200 },
  { date: '2024-02-05', variety: 'ROBUSTA', quantity: 8000, unitPrice: 3.50, totalAmount: 28000 },
  { date: '2024-02-18', variety: 'FINE_ROBUSTA', quantity: 2000, unitPrice: 6.50, totalAmount: 13000 },
  { date: '2024-03-01', variety: 'ARABICA', quantity: 500, unitPrice: 8.80, totalAmount: 4400 },
  { date: '2024-03-10', variety: 'ROBUSTA', quantity: 10000, unitPrice: 3.60, totalAmount: 36000 },
];

// Collect new transaction data from PO events
eventBus.subscribe<POCreatedPayload>(EventType.PO_CREATED, async (event) => {
  event.payload.items.forEach((item) => {
    transactionHistory.push({
      date: new Date().toISOString().split('T')[0],
      variety: '', // Would resolve from product data
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.quantity * item.unitPrice,
    });
  });
  console.log(`[AI Service] 🧠 Collected transaction data from PO ${event.payload.poNumber}`);
});

// ── Mock AI Predictions ──────────────────────────────────────

function generatePriceForecasts() {
  const varieties = [
    { variety: 'ARABICA', current: 8.50, range: [7.80, 9.40] },
    { variety: 'ROBUSTA', current: 3.80, range: [3.20, 4.50] },
    { variety: 'FINE_ROBUSTA', current: 6.80, range: [6.00, 7.60] },
    { variety: 'LIBERICA', current: 5.20, range: [4.80, 5.90] },
    { variety: 'EXCELSA', current: 7.10, range: [6.40, 7.80] },
  ];

  return varieties.map((v) => {
    const change = (Math.random() - 0.45) * 0.3; // slight upward bias
    const predicted = +(v.current * (1 + change)).toFixed(2);
    return {
      variety: v.variety,
      currentPrice: v.current,
      predictedPrice: predicted,
      confidence: +(0.65 + Math.random() * 0.3).toFixed(2),
      trend: predicted > v.current * 1.02 ? 'up' : predicted < v.current * 0.98 ? 'down' : 'stable',
      period: `2024-Q${Math.ceil((new Date().getMonth() + 2) / 3)}`,
      priceHistory: generatePriceHistory(v.current, 12),
    };
  });
}

function generatePriceHistory(currentPrice: number, months: number) {
  const history = [];
  let price = currentPrice * 0.85;
  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    price = price * (1 + (Math.random() - 0.45) * 0.08);
    history.push({
      date: date.toISOString().split('T')[0].slice(0, 7),
      price: +price.toFixed(2),
    });
  }
  return history;
}

function generateMarketInsights() {
  return [
    {
      id: uuidv4(),
      title: 'Sản lượng Robusta Việt Nam giảm 12% do hạn hán',
      summary: 'Vùng Tây Nguyên chịu ảnh hưởng El Niño, sản lượng Robusta dự kiến giảm 12% so với cùng kỳ. Giá có xu hướng tăng trong Q2.',
      variety: 'ROBUSTA',
      region: 'Central Highlands, Vietnam',
      impact: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Arabica Lâm Đồng đạt điểm cupping kỷ lục 88',
      summary: 'Lô Arabica honey process từ Lâm Đồng đạt 88 điểm cupping tại SCA, nâng giá trị xuất khẩu specialty coffee Vietnam.',
      variety: 'ARABICA',
      region: 'Lam Dong, Vietnam',
      impact: 'medium',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Nhu cầu Fine Robusta tăng 25% từ thị trường EU',
      summary: 'Thị trường châu Âu chuyển dịch sang Fine Robusta do chi phí Arabica tăng cao. Cơ hội lớn cho xưởng rang Việt Nam.',
      variety: 'FINE_ROBUSTA',
      region: 'Europe',
      impact: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Giá vận chuyển container giảm 15%',
      summary: 'Giá freight từ Vietnam sang EU/US giảm 15% so với Q4/2023. Chi phí FOB cạnh tranh hơn cho xuất khẩu hạt xanh.',
      variety: 'ROBUSTA',
      region: 'Global',
      impact: 'medium',
      createdAt: new Date().toISOString(),
    },
  ];
}

function generateDemandForecast() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((month, i) => ({
    month,
    arabica: Math.round(2000 + Math.random() * 3000 + (i >= 8 && i <= 11 ? 2000 : 0)),
    robusta: Math.round(5000 + Math.random() * 8000 + (i >= 9 ? 3000 : 0)),
    fineRobusta: Math.round(1000 + Math.random() * 2000),
  }));
}

// ── Routes ──────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ai-service', timestamp: new Date().toISOString() });
});

// Price forecasts
app.get('/api/ai/forecasts', (_req, res) => {
  res.json({ success: true, data: generatePriceForecasts() });
});

// Market insights
app.get('/api/ai/insights', (_req, res) => {
  res.json({ success: true, data: generateMarketInsights() });
});

// Demand forecast
app.get('/api/ai/demand', (_req, res) => {
  res.json({ success: true, data: generateDemandForecast() });
});

// Transaction summary
app.get('/api/ai/transactions-summary', (_req, res) => {
  const totalVolume = transactionHistory.reduce((s, t) => s + t.quantity, 0);
  const totalValue = transactionHistory.reduce((s, t) => s + t.totalAmount, 0);
  const avgPrice = totalValue / totalVolume;

  res.json({
    success: true,
    data: {
      totalTransactions: transactionHistory.length,
      totalVolume: `${totalVolume.toLocaleString()} kg`,
      totalValue: `$${totalValue.toLocaleString()}`,
      averagePrice: `$${avgPrice.toFixed(2)}/kg`,
      history: transactionHistory,
    },
  });
});

app.listen(PORT, () => {
  console.log(`🧠 AI Service running on port ${PORT}`);
});

export default app;
