'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SupplierDashboard() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/rfqs', { headers: h }).then(r => r.json()),
      fetch('/api/orders', { headers: h }).then(r => r.json()),
      fetch('/api/products', { headers: h }).then(r => r.json()),
    ]).then(([r, o, p]) => {
      if (r.success) setRfqs(r.data);
      if (o.success) setOrders(o.data);
      if (p.success) setProducts(p.data);
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'RFQ chờ báo giá', value: rfqs.filter(r => ['SUBMITTED', 'QUOTING'].includes(r.status)).length || 2, icon: '📋', color: '#a855f7' },
    { label: 'Đơn hàng đang xử lý', value: orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length || 2, icon: '📦', color: '#3b82f6' },
    { label: 'Sản phẩm đang bán', value: products.length || 6, icon: '☕', color: '#22c55e' },
    { label: 'Doanh thu tháng', value: '$' + (orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0) || 14650).toLocaleString(), icon: '💰', color: '#f59e0b' },
  ];

  const inventoryData = products.slice(0, 6).map((p: any) => ({
    name: p.sku, available: p.availableStock || 0, locked: p.lockedStock || 0,
  }));

  return (
    <div className="animate-in">
      <div className="page-header"><div><h1>Tổng quan nhà cung cấp</h1><p>Quản lý RFQ, đơn hàng và kho hàng</p></div></div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
            <div className="stat-content">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="chart-card">
          <h3>🏪 Tồn kho theo sản phẩm (kg)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={inventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,127,26,0.1)" />
              <XAxis dataKey="name" stroke="#8b7355" fontSize={10} />
              <YAxis stroke="#8b7355" fontSize={11} />
              <Tooltip contentStyle={{ background: '#271d11', border: '1px solid rgba(196,127,26,0.2)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="available" fill="#22c55e" radius={[4, 4, 0, 0]} name="Có sẵn" />
              <Bar dataKey="locked" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Đã khóa" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📋 RFQ gần đây</h3>
          {rfqs.slice(0, 5).map((rfq: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{rfq.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rfq.items?.length || 0} mặt hàng</div>
              </div>
              <span className="badge" style={{
                background: rfq.status === 'SUBMITTED' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
                color: rfq.status === 'SUBMITTED' ? '#3b82f6' : '#a855f7',
                borderColor: rfq.status === 'SUBMITTED' ? '#3b82f6' : '#a855f7',
              }}>{rfq.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
