'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Tổng quan', icon: '📊', href: '/supplier/dashboard' },
  { label: 'RFQ nhận được', icon: '📋', href: '/supplier/rfqs' },
  { label: 'Đơn hàng', icon: '📦', href: '/supplier/orders' },
  { label: 'Kho hàng', icon: '🏪', href: '/supplier/inventory' },
  { label: 'Chat thương lượng', icon: '💬', href: '/supplier/chat' },
];

export default function SupplierPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    setUser(JSON.parse(userData));
    const c = localStorage.getItem('company');
    if (c) setCompany(JSON.parse(c));
  }, [router]);

  if (!user) return null;

  return (
    <div className="app-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #854c12, #c47f1a)' }}>🏭</div>
          <div className="logo-text">Supplier <span>Portal</span></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Quản lý</div>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}
              className={`nav-item ${pathname === item.href || pathname?.startsWith(item.href + '/') ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid var(--glass-border)' }}>
          <button className="nav-item" onClick={() => setCollapsed(!collapsed)}>
            <span className="nav-icon">{collapsed ? '▶' : '◀'}</span><span>Thu gọn</span>
          </button>
          <button className="nav-item" onClick={() => { localStorage.clear(); router.push('/'); }}>
            <span className="nav-icon">🚪</span><span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="header">
          <div className="header-left"><h2 className="header-title">{company?.name || 'Supplier Portal'}</h2></div>
          <div className="header-right">
            <button className="header-btn">🔔</button>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #854c12, #c47f1a)' }}>{user.name?.charAt(0)}</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
