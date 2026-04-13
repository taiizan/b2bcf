'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupplierRFQsPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    unitPrice: 80000,
    validUntil: '',
    notes: 'Hàng chất lượng cao, giao ngay.',
    deliveryTerms: 'FOB Ho Chi Minh',
    paymentTerms: 'Đổi trả trong 7 ngày',
  });

  useEffect(() => {
    fetchRfqs();
  }, []);

  async function fetchRfqs() {
    try {
      const token = localStorage.getItem('token');
      // Fetch all RFQs (ideally we would filter by status=SUBMITTED)
      const res = await fetch(`/api/rfqs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Only show RFQs that need quoting or are recently quoted
        setRfqs(data.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRfq) return;
    setSubmitting(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const payload = {
        rfqId: selectedRfq.id,
        supplierId: user.companyId,
        supplierContactId: user.id,
        validUntil: form.validUntil,
        notes: form.notes,
        deliveryTerms: form.deliveryTerms,
        paymentTerms: form.paymentTerms,
        items: selectedRfq.items.map((item: any) => ({
          rfqItemId: item.id,
          productId: 'prod-01', // Mock product ID for demo
          quantity: item.quantity,
          unit: 'KG',
          unitPrice: Number(form.unitPrice),
        }))
      };

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.success) {
        setSelectedRfq(null);
        fetchRfqs();
        alert('Gửi báo giá thành công!');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Lỗi khi gửi báo giá');
    } finally {
      setSubmitting(false);
    }
  }

  const handleChat = async (rfq: any) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      await fetch('http://localhost:4000/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rfqId: rfq.id, participants: [user.id, rfq.buyerContactId || rfq.buyerId] })
      });
      router.push('/supplier/chat');
    } catch (err) {
      console.error(err);
      router.push('/supplier/chat');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'var(--primary-color)';
      case 'QUOTED': return '#f59e0b';
      case 'ACCEPTED': return '#10b981';
      case 'REJECTED': return '#ef4444';
      default: return '#888';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Yêu cầu báo giá (RFQs) nhận được</h1>
      </div>

      <div className="card">
        <h3 className="card-title">Danh sách RFQ từ Buyers</h3>
        {loading ? <p>Đang tải...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ RFQ</th>
                <th>TIÊU ĐỀ</th>
                <th>BUYER</th>
                <th>SẢN PHẨM</th>
                <th>KHỐI LƯỢNG</th>
                <th>YÊU CẦU GIÁ</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq.id}>
                  <td style={{ fontWeight: 600 }}>{rfq.id}</td>
                  <td>{rfq.title || 'N/A'}</td>
                  <td>{rfq.buyerId}</td>
                  <td>{rfq.items?.[0]?.variety} ({rfq.items?.[0]?.processing})</td>
                  <td>{rfq.items?.[0]?.quantity?.toLocaleString()} KG</td>
                  <td style={{ color: '#10b981' }}>{rfq.items?.[0]?.targetPrice?.toLocaleString()} đ</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                      background: `${getStatusColor(rfq.status)}22`,
                      color: getStatusColor(rfq.status)
                    }}>
                      {rfq.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {rfq.status === 'SUBMITTED' ? (
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 13 }}
                          onClick={() => setSelectedRfq(rfq)}>
                          Báo giá ngay
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Đã xử lý</span>
                      )}
                      
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => handleChat(rfq)}>
                        💬 Nhắn tin
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rfqs.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Chưa có yêu cầu báo giá nào</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {selectedRfq && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, margin: 20 }}>
            <h3 className="card-title">Gửi Báo Giá cho: {selectedRfq.id}</h3>
            <div style={{ padding: 12, background: 'var(--bg-color)', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
              <strong>Sản phẩm yêu cầu:</strong> {selectedRfq.items?.[0]?.variety} ({selectedRfq.items?.[0]?.processing})<br/>
              <strong>Khối lượng:</strong> {selectedRfq.items?.[0]?.quantity?.toLocaleString()} KG<br/>
              <strong>Giá mục tiêu của Buyer:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{selectedRfq.items?.[0]?.targetPrice?.toLocaleString()} VNĐ</span>
            </div>

            <form onSubmit={handleQuoteSubmit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Đơn giá chào bán (VNĐ/KG)</label>
                <input className="form-input" type="number" required
                  value={form.unitPrice} onChange={e => setForm({...form, unitPrice: Number(e.target.value)})} />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Báo giá có hiệu lực đến</label>
                <input className="form-input" type="date" required
                  value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Điều khoản giao hàng</label>
                  <input className="form-input" required
                    value={form.deliveryTerms} onChange={e => setForm({...form, deliveryTerms: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Điều khoản thanh toán</label>
                  <input className="form-input" required
                    value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value})} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Ghi chú gửi Buyer</label>
                <textarea className="form-input" rows={2}
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedRfq(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : 'Xác nhận Báo giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
