'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [variety, setVariety] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Purchase Modal State
  const [purchaseModal, setPurchaseModal] = useState<any>(null);
  const [purchaseForm, setPurchaseForm] = useState({ quantity: 1000, address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);


  useEffect(() => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (variety) params.set('variety', variety);

    fetch(`/api/products?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, variety]);

  const coffeeEmojis: Record<string, string> = {
    ARABICA: '🫘', ROBUSTA: '☕', FINE_ROBUSTA: '✨', LIBERICA: '🌿', EXCELSA: '🌺',
  };

  const handleDisplayPurchaseModal = (product: any) => {
    setPurchaseModal(product);
    setPurchaseForm({ quantity: product.priceTiers?.[0]?.minQty || 1000, address: '', notes: '' });
  };

  const handleDirectPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseModal) return;
    setSubmitting(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      const priceToUse = purchaseModal.priceTiers?.slice().reverse().find((t: any) => purchaseForm.quantity >= t.minQty)?.pricePerUnit || purchaseModal.basePrice;

      const payload = {
        buyerId: user.companyId,
        supplierId: purchaseModal.supplierId || 'SUPPLIER-DEFAULT', 
        deliveryAddress: purchaseForm.address,
        notes: purchaseForm.notes,
        items: [{
          productId: purchaseModal.id,
          sku: purchaseModal.sku,
          name: purchaseModal.name,
          variety: purchaseModal.variety,
          quantity: Number(purchaseForm.quantity),
          unit: 'KG',
          unitPrice: priceToUse
        }]
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã tạo đơn mua hàng trực tiếp thành công!');
        setPurchaseModal(null);
        router.push('/buyer/orders');
      } else {
        alert(data.error || 'Có lỗi xảy ra khi mua hàng');
      }
    } catch (err) {
      alert('Lỗi khi tạo đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>Danh mục sản phẩm</h1>
          <p>Khám phá nguồn cà phê chất lượng cao từ các nhà cung cấp uy tín</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div className="search-box" style={{ flex: 1 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Tìm theo tên, SKU, vùng trồng..."
            value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, width: '100%' }} />
        </div>
        <select className="form-select" value={variety} onChange={(e) => setVariety(e.target.value)}
          style={{ width: 180 }}>
          <option value="">Tất cả giống</option>
          <option value="ARABICA">Arabica</option>
          <option value="ROBUSTA">Robusta</option>
          <option value="FINE_ROBUSTA">Fine Robusta</option>
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="empty-state"><div className="empty-icon" style={{ animation: 'pulse 1.5s infinite' }}>☕</div><p>Đang tải sản phẩm...</p></div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📦</div><h3>Không tìm thấy sản phẩm</h3><p>Thử thay đổi bộ lọc</p></div>
      ) : (
        <div className="grid-3">
          {products.map((product: any) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {coffeeEmojis[product.variety] || '☕'}
                <div className="origin-badge">📍 {product.origin}</div>
                {product.cuppingScore && (
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: product.cuppingScore >= 85 ? 'rgba(34,197,94,0.2)' : 'rgba(196,127,26,0.2)',
                    border: `1px solid ${product.cuppingScore >= 85 ? '#22c55e' : '#c47f1a'}`,
                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    color: product.cuppingScore >= 85 ? '#22c55e' : '#c47f1a',
                  }}>
                    {product.cuppingScore} pts
                  </div>
                )}
              </div>
              <div className="product-info">
                <div className="product-variety">
                  {coffeeEmojis[product.variety]} {product.variety?.replace('_', ' ')}
                </div>
                <div className="product-name">{product.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  SKU: {product.sku} • {product.processing} • {product.grade}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description}
                </div>

                {/* Volume Pricing */}
                {product.priceTiers?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Giá theo sản lượng</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {product.priceTiers.map((tier: any, i: number) => (
                        <div key={i} style={{
                          background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 6, fontSize: 11,
                          border: '1px solid var(--border-color)',
                        }}>
                          <span style={{ color: 'var(--text-muted)' }}>{tier.minQty}+ kg </span>
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>${tier.pricePerUnit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="product-meta">
                  <div className="product-price">
                    ${product.basePrice} <span className="unit">/kg</span>
                  </div>
                  <div className={`product-stock ${product.availableStock < 5000 ? 'low' : ''}`}>
                    {(product.availableStock || 0).toLocaleString()} kg
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => router.push(`/buyer/rfq?presetVariety=${product.variety}`)}>📋 Yêu cầu báo giá</button>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => handleDisplayPurchaseModal(product)}>
                    🛒 Mua ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Direct Purchase Modal */}
      {purchaseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, margin: 20 }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              🛒 Mua Trực Tiếp: {purchaseModal.name}
            </h3>
            
            <div style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid var(--border-color)' }}>
              <strong>Giá cơ bản:</strong> ${purchaseModal.basePrice}/KG<br/>
              {purchaseModal.priceTiers?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <strong>Chiết khấu:</strong> {purchaseModal.priceTiers.map((t: any) => `${t.minQty}KG+ ($${t.pricePerUnit})`).join(' | ')}
                </div>
              )}
            </div>

            <form onSubmit={handleDirectPurchase}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Khối lượng (KG)</label>
                <input className="form-input" type="number" required min={1}
                  value={purchaseForm.quantity} onChange={e => setPurchaseForm({...purchaseForm, quantity: Number(e.target.value)})} />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Địa chỉ giao hàng</label>
                <input className="form-input" required placeholder="Nhập địa chỉ nhận hàng"
                  value={purchaseForm.address} onChange={e => setPurchaseForm({...purchaseForm, address: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Ghi chú cho nhà cung cấp</label>
                <textarea className="form-input" rows={2} placeholder="Yêu cầu đóng gói, thời gian nhận..."
                  value={purchaseForm.notes} onChange={e => setPurchaseForm({...purchaseForm, notes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPurchaseModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Xác nhận Mua ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
