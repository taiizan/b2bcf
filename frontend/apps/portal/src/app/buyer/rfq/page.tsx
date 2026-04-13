'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyerRFQPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    deadline: '',
    notes: '',
    variety: 'Robusta',
    processing: 'Natural',
    origin: 'Dak Lak',
    quantity: 1000,
    targetPrice: 75000,
  });

  useEffect(() => {
    fetchRfqs();
  }, []);

  async function fetchRfqs() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      if (!user.id) return;

      const res = await fetch(`/api/rfqs?buyerId=${user.companyId}`, { // Correctly fetch for company
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRfqs(data.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (rfq: any) => {
    setForm({
      title: rfq.title || '',
      deadline: rfq.deadline ? rfq.deadline.split('T')[0] : '',
      notes: rfq.notes || '',
      variety: rfq.items?.[0]?.variety || 'Robusta',
      processing: rfq.items?.[0]?.processing || 'Natural',
      origin: rfq.items?.[0]?.origin || 'Dak Lak',
      quantity: rfq.items?.[0]?.quantity || 1000,
      targetPrice: rfq.items?.[0]?.targetPrice || 75000,
    });
    setEditingId(rfq.id);
    setShowModal(true);
  };

  const handleChat = async (rfq: any) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      await fetch('http://localhost:4000/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rfqId: rfq.id, participants: [user.id] })
      });
      router.push('/buyer/chat');
    } catch (err) {
      console.error(err);
      router.push('/buyer/chat');
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      const payload = {
        buyerId: user.companyId,
        buyerContactId: user.id,
        title: form.title || `Yêu cầu báo giá ${form.variety}`,
        deadline: form.deadline,
        notes: form.notes,
        items: [{
          variety: form.variety,
          processing: form.processing,
          origin: form.origin,
          quantity: Number(form.quantity),
          unit: 'KG',
          targetPrice: Number(form.targetPrice),
          notes: ''
        }]
      };

      const url = editingId ? `/api/rfqs/${editingId}` : '/api/rfqs';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingId(null);
        fetchRfqs();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Lỗi khi tạo RFQ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Yêu cầu báo giá (RFQs)</h1>
        <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowModal(true); }}>
          + Tạo RFQ mới
        </button>
      </div>

      <div className="card">
        <h3 className="card-title">Danh sách RFQ của bạn</h3>
        {loading ? <p>Đang tải...</p> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ RFQ</th>
                <th>TIÊU ĐỀ</th>
                <th>TRẠNG THÁI</th>
                <th>SẢN PHẨM</th>
                <th>KHỐI LƯỢNG</th>
                <th>HẠN CHÓT</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {rfqs.map(rfq => (
                <tr key={rfq.id}>
                  <td style={{ fontWeight: 600 }}>{rfq.id}</td>
                  <td>{rfq.title}</td>
                  <td>
                    <span className={`status-badge status-${rfq.status.toLowerCase()}`}>
                      {rfq.status}
                    </span>
                  </td>
                  <td>{rfq.items?.[0]?.variety} ({rfq.items?.[0]?.processing})</td>
                  <td>{rfq.items?.[0]?.quantity?.toLocaleString()} KG</td>
                  <td>{new Date(rfq.deadline).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {rfq.status === 'SUBMITTED' && (
                        <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleEdit(rfq)}>
                          ✏️ Sửa
                        </button>
                      )}
                      <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleChat(rfq)}>
                        💬 Nhắn tin
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rfqs.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Chưa có yêu cầu báo giá nào</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, margin: 20 }}>
            <h3 className="card-title">{editingId ? 'Sửa Yêu cầu Báo giá' : 'Tạo Yêu cầu Báo giá mới (RFQ)'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Tiêu đề RFQ</label>
                <input className="form-input" required placeholder="VD: Mua 2 tấn Robusta cho quý 4"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Loại hạt</label>
                  <select className="form-input" value={form.variety} onChange={e => setForm({...form, variety: e.target.value})}>
                    <option>Robusta</option><option>Arabica</option><option>Excelsa</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Sơ chế</label>
                  <select className="form-input" value={form.processing} onChange={e => setForm({...form, processing: e.target.value})}>
                    <option>Natural</option><option>Washed</option><option>Honey</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Khối lượng (KG)</label>
                  <input className="form-input" type="number" required
                    value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Khoảng giá (VNĐ/KG)</label>
                  <input className="form-input" type="number" required
                    value={form.targetPrice} onChange={e => setForm({...form, targetPrice: Number(e.target.value)})} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Hạn chót báo giá</label>
                <input className="form-input" type="date" required
                  value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Ghi chú thêm</label>
                <textarea className="form-input" rows={2}
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingId(null); }}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang gửi...' : (editingId ? 'Cập nhật RFQ' : 'Gửi RFQ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
