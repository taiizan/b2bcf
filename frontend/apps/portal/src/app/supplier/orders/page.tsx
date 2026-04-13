'use client';
import { useEffect, useState } from 'react';

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      if (!user.companyId) return;

      const res = await fetch(`/api/orders?supplierId=${user.companyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'CONFIRMED': return '#3b82f6';
      case 'PROCESSING': return '#8b5cf6';
      case 'SHIPPED': return '#0ea5e9';
      case 'DELIVERED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#888';
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders(); // Reload
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>📦 Quản lý Đơn Hàng</h1>
          <p>Trạng thái và tiến độ xử lý đơn hàng từ Buyer</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Danh sách Đơn mua hàng (PO)</h3>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ PO</th>
                <th>MÃ RFQ / Báo giá</th>
                <th>SẢN PHẨM</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((po: any) => (
                <tr key={po.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{po.poNumber}</td>
                  <td>{po.rfqId || 'N/A'}<br/><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{po.quoteId}</span></td>
                  <td>
                    {po.items?.length > 0 ? (
                      <>
                        <strong>{po.items[0].name || po.items[0].variety}</strong><br/>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{po.items[0].quantity} {po.items[0].unit} - {po.items.length > 1 ? `+${po.items.length - 1} sp khác` : ''}</span>
                      </>
                    ) : 'Không có SP'}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{po.totalAmount.toLocaleString()} đ</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: `${getStatusColor(po.status)}22`, color: getStatusColor(po.status) 
                    }}>
                      {po.status}
                    </span>
                  </td>
                  <td>
                    <select 
                      className="form-select" 
                      style={{ padding: '4px', fontSize: 12, width: 140 }}
                      value={po.status} 
                      onChange={(e) => updateStatus(po.id, e.target.value)}
                    >
                      <option value="PENDING">Chờ xác nhận</option>
                      <option value="CONFIRMED">Đã xác nhận</option>
                      <option value="PROCESSING">Đang xử lý</option>
                      <option value="SHIPPED">Đang giao</option>
                      <option value="DELIVERED">Đã giao hoàn tất</option>
                      <option value="CANCELLED">Hủy đơn</option>
                    </select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Chưa có đơn hàng nào</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
