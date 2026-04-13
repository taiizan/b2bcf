'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardPage() {
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/ai/forecasts', { headers }).then(r => r.json()),
      fetch('/api/ai/insights', { headers }).then(r => r.json()),
      fetch('/api/orders?limit=5', { headers }).then(r => r.json()),
      fetch('/api/rfqs?limit=5', { headers }).then(r => r.json()),
    ]).then(([fc, ins, ord, rfq]) => {
      if (fc.success) setForecasts(fc.data);
      if (ins.success) setInsights(ins.data);
      if (ord.success) setOrders(ord.data);
      if (rfq.success) setRfqs(rfq.data);
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'Đơn hàng đang xử lý', value: orders.filter(o => ['PROCESSING', 'ROASTING', 'CONFIRMED'].includes(o.status)).length || 3, icon: '📦', color: '#3b82f6', change: '+2 tuần này', up: true },
    { label: 'RFQ đang chờ', value: rfqs.filter(r => ['SUBMITTED', 'QUOTING'].includes(r.status)).length || 2, icon: '📋', color: '#a855f7', change: '1 mới hôm nay', up: true },
    { label: 'Tổng giá trị PO', value: '$' + (orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0) || 14650).toLocaleString(), icon: '💰', color: '#22c55e', change: '+18% vs tháng trước', up: true },
    { label: 'Giá Robusta TB', value: '$3.80/kg', icon: '📈', color: '#f59e0b', change: '+5.2% 30 ngày', up: true },
  ];

  const chartData = forecasts.length > 0
    ? forecasts.find(f => f.variety === 'ROBUSTA')?.priceHistory || []
    : Array.from({ length: 12 }, (_, i) => ({
        date: `2024-${String(i + 1).padStart(2, '0')}`,
        price: +(3.2 + Math.random() * 0.8).toFixed(2),
      }));

  const demandData = [
    { month: 'T1', arabica: 1200, robusta: 5400 },
    { month: 'T2', arabica: 1800, robusta: 6200 },
    { month: 'T3', arabica: 2100, robusta: 5800 },
    { month: 'T4', arabica: 2400, robusta: 7100 },
    { month: 'T5', arabica: 2000, robusta: 6500 },
    { month: 'T6', arabica: 2600, robusta: 7800 },
  ];

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Tổng quan</h1>
          <p>Chào mừng trở lại! Đây là tình hình mua hàng của bạn.</p>
        </div>
        <button className="btn btn-primary">
          ➕ Tạo RFQ mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {stats.map((stat, i) => (
          <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value}</div>
              <div className={`stat-change ${stat.up ? 'up' : 'down'}`}>
                {stat.up ? '↑' : '↓'} {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <h3>📈 Biến động giá Robusta (12 tháng)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c47f1a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c47f1a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,127,26,0.1)" />
              <XAxis dataKey="date" stroke="#8b7355" fontSize={11} />
              <YAxis stroke="#8b7355" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#271d11', border: '1px solid rgba(196,127,26,0.2)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="price" stroke="#c47f1a" fill="url(#priceGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>📊 Khối lượng mua theo tháng (kg)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,127,26,0.1)" />
              <XAxis dataKey="month" stroke="#8b7355" fontSize={11} />
              <YAxis stroke="#8b7355" fontSize={11} />
              <Tooltip contentStyle={{ background: '#271d11', border: '1px solid rgba(196,127,26,0.2)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="robusta" fill="#c47f1a" radius={[4, 4, 0, 0]} name="Robusta" />
              <Bar dataKey="arabica" fill="#e5b96e" radius={[4, 4, 0, 0]} name="Arabica" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid-2">
        {/* Recent Orders */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            📦 Đơn hàng gần đây
          </h3>
          {(orders.length > 0 ? orders : [
            { poNumber: 'PO-2024-001', status: 'PROCESSING', totalAmount: 8560, items: [{ name: 'Robusta Natural' }] },
            { poNumber: 'PO-2024-002', status: 'ROASTING', totalAmount: 6090, items: [{ name: 'Arabica Honey' }] },
          ]).slice(0, 5).map((order: any, i: number) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{order.poNumber}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {order.items?.[0]?.name || 'Coffee products'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>
                  ${(order.totalAmount || 0).toLocaleString()}
                </div>
                <span className="badge" style={{
                  fontSize: 10,
                  ...(order.status === 'PROCESSING' ? { background: 'rgba(168,85,247,0.15)', color: '#a855f7', borderColor: '#a855f7' } :
                    order.status === 'ROASTING' ? { background: 'rgba(249,115,22,0.15)', color: '#f97316', borderColor: '#f97316' } :
                    { background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderColor: '#3b82f6' }),
                }}>{order.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Market Insights */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
            🧠 Tin thị trường
          </h3>
          {(insights.length > 0 ? insights : [
            { title: 'Sản lượng Robusta giảm 12%', summary: 'Tây Nguyên chịu ảnh hưởng El Niño', impact: 'high' },
            { title: 'Arabica Lâm Đồng đạt 88 điểm', summary: 'Giá trị xuất khẩu specialty tăng', impact: 'medium' },
            { title: 'Fine Robusta tăng 25% tại EU', summary: 'Cơ hội lớn cho xưởng rang Việt Nam', impact: 'high' },
          ]).slice(0, 4).map((insight: any, i: number) => (
            <div key={i} style={{
              padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: insight.impact === 'high' ? '#e84545' : insight.impact === 'medium' ? '#f59e0b' : '#22c55e',
                  flexShrink: 0,
                }} />
                <div style={{ fontWeight: 600, fontSize: 13 }}>{insight.title}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 16 }}>
                {insight.summary}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
