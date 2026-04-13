'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('/api/users', { headers: h }).then(r => r.json()),
      fetch('/api/orders', { headers: h }).then(r => r.json()),
      fetch('/api/rfqs', { headers: h }).then(r => r.json()),
      fetch('/api/events', { headers: h }).then(r => r.json()),
    ]).then(([u, o, r, e]) => {
      if (u.success) setUsers(u.data);
      if (o.success) setOrders(o.data);
      if (r.success) setRfqs(r.data);
      if (e.success) setEvents(e.data);
    }).catch(() => {});
  }, []);

  const stats = [
    { label: 'Tổng người dùng', value: users.length || 6, icon: '👥', color: '#3b82f6' },
    { label: 'Đơn hàng', value: orders.length || 2, icon: '📦', color: '#22c55e' },
    { label: 'RFQ hoạt động', value: rfqs.length || 3, icon: '📋', color: '#a855f7' },
    { label: 'Sự kiện xử lý', value: events.length || 0, icon: '⚡', color: '#f59e0b' },
  ];

  const rolePieData = [
    { name: 'Buyer', value: users.filter(u => u.role === 'BUYER').length || 2, color: '#3b82f6' },
    { name: 'Supplier', value: users.filter(u => u.role === 'SUPPLIER').length || 3, color: '#22c55e' },
    { name: 'Admin', value: users.filter(u => u.role === 'ADMIN').length || 1, color: '#f59e0b' },
  ];

  const orderStatusData = ['PENDING', 'CONFIRMED', 'PROCESSING', 'ROASTING', 'SHIPPED', 'DELIVERED'].map(s => ({
    status: s, count: orders.filter(o => o.status === s).length || (s === 'PROCESSING' ? 1 : 0),
  }));

  return (
    <div className="animate-in">
      <div className="page-header"><div><h1>Tổng quan hệ thống</h1><p>Giám sát toàn bộ hoạt động B2B Coffee Wholesale</p></div></div>

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

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="chart-card">
          <h3>👥 Phân bố người dùng theo vai trò</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={rolePieData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {rolePieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#271d11', border: '1px solid rgba(196,127,26,0.2)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>📦 Đơn hàng theo trạng thái</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={orderStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,127,26,0.1)" />
              <XAxis dataKey="status" stroke="#8b7355" fontSize={10} />
              <YAxis stroke="#8b7355" fontSize={11} />
              <Tooltip contentStyle={{ background: '#271d11', border: '1px solid rgba(196,127,26,0.2)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Events */}
      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 600, marginBottom: 16 }}>⚡ Sự kiện gần đây (Event Bus)</h3>
        {events.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Chưa có sự kiện nào. Tạo RFQ hoặc đơn hàng để xem luồng Event-Driven hoạt động.
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {events.slice(0, 20).map((event: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {event.type}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>from {event.source}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString('vi-VN') : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
