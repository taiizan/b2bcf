'use client';

import { useEffect, useState } from 'react';

const STATUS_STYLES: Record<string, any> = {
  PENDING: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24', icon: '⏳' },
  CONFIRMED: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', icon: '✅' },
  PROCESSING: { bg: 'rgba(168,85,247,0.15)', color: '#a855f7', icon: '⚙️' },
  ROASTING: { bg: 'rgba(249,115,22,0.15)', color: '#f97316', icon: '🔥' },
  QUALITY_CHECK: { bg: 'rgba(14,165,233,0.15)', color: '#0ea5e9', icon: '🔬' },
  SHIPPED: { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', icon: '🚚' },
  DELIVERED: { bg: 'rgba(34,197,94,0.25)', color: '#16a34a', icon: '📬' },
  CANCELLED: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444', icon: '❌' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setOrders(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Đơn hàng</h1>
          <p>Theo dõi trạng thái đơn mua cà phê của bạn</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {/* Orders Table */}
        <div className="card" style={{ flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã PO</th>
                <th>Sản phẩm</th>
                <th>Trạng thái</th>
                <th>Tổng giá trị</th>
                <th>Giao hàng dự kiến</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Đang tải...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Chưa có đơn hàng</td></tr>
              ) : (
                orders.map((order: any) => {
                  const style = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
                  return (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)}
                      style={{ cursor: 'pointer', background: selectedOrder?.id === order.id ? 'rgba(196,127,26,0.06)' : undefined }}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)', fontSize: 12 }}>
                        {order.poNumber}
                      </td>
                      <td>
                        {order.items?.map((item: any) => (
                          <div key={item.id} style={{ fontSize: 13 }}>
                            {item.name} — {item.quantity?.toLocaleString()} {item.unit || 'kg'}
                          </div>
                        ))}
                      </td>
                      <td>
                        <span className="badge" style={{ background: style.bg, color: style.color, borderColor: style.color }}>
                          {style.icon} {order.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)' }}>
                        ${(order.totalAmount || 0).toLocaleString()}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Order Detail Sidebar */}
        {selectedOrder && (
          <div className="card" style={{ width: 360, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700 }}>
                {selectedOrder.poNumber}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            {/* Amount Breakdown */}
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Thành tiền</span>
                <span>${(selectedOrder.subtotal || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Thuế (10%)</span>
                <span>${(selectedOrder.tax || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Vận chuyển</span>
                <span>${(selectedOrder.shippingCost || 0).toLocaleString()}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700 }}>Tổng cộng</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>
                  ${(selectedOrder.totalAmount || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 12 }}>
                Lịch sử trạng thái
              </div>
              {(selectedOrder.timeline || []).map((event: any, i: number) => {
                const style = STATUS_STYLES[event.status] || STATUS_STYLES.PENDING;
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, position: 'relative' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: style.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, flexShrink: 0, border: `1px solid ${style.color}30`,
                    }}>{style.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: style.color }}>{event.status}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{event.note}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                        {event.createdAt ? new Date(event.createdAt).toLocaleString('vi-VN') : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
