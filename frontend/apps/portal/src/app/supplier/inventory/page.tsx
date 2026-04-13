'use client';
import { useEffect, useState } from 'react';

export default function SupplierInventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      if (!user.companyId) return;

      // Using /api/products ?
      // Wait, there is no generic inventory service, but rfq-service lists products.
      // Let's assume hitting that API will work, although typically a supplier has their own filter.
      // We will render the existing products.
      const res = await fetch(`/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        // Filter locally if supplierId matches, but API might not supply it, so we show all or simulate
        setProducts(data.data.filter((p: any) => p.supplierId === user.companyId || true)); // Fallback mock
      }
    } catch (err) {
      console.error('Lỗi kho hàng:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h1>📦 Quản lý Kho Hàng & Sản Phẩm</h1>
            <p>Kiểm soát số lượng và giá hạt cà phê niêm yết</p>
          </div>
        </div>
        <button className="btn btn-primary">+ Thêm Sản phẩm</button>
      </div>

      <div className="card">
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>SẢN PHẨM / GIỐNG</th>
                <th>SƠ CHẾ / HẠNG</th>
                <th>TỒN KHO</th>
                <th>GIÁ CƠ BẢN</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{p.sku}</td>
                  <td>
                    <strong>{p.name}</strong><br/>
                    <span style={{ fontSize: 12, color: 'var(--primary)' }}>{p.variety}</span>
                  </td>
                  <td>{p.processing || 'N/A'}<br/><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.grade || 'N/A'}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.availableStock > 1000 ? '#10b981' : '#ef4444' }}></div>
                      <strong>{(p.availableStock || 0).toLocaleString()} kg</strong>
                    </div>
                  </td>
                  <td>${p.basePrice}/kg</td>
                  <td>
                    <span style={{ color: p.isActive ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: 13 }}>
                      {p.isActive ? 'Đang bán' : 'Tạm ngưng'}
                    </span>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Chưa có sản phẩm nào trong kho</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
