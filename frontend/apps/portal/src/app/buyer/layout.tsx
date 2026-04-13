'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Tổng quan', icon: '📊', href: '/buyer/dashboard' },
  { label: 'Danh mục sản phẩm', icon: '☕', href: '/buyer/catalog' },
  { label: 'Yêu cầu báo giá (RFQ)', icon: '📋', href: '/buyer/rfq' },
  { label: 'Đơn hàng', icon: '📦', href: '/buyer/orders' },
  { label: 'Thương lượng giá', icon: '💬', href: '/buyer/chat' },
  { label: 'Dự báo thị trường', icon: '🧠', href: '/buyer/market' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    setUser(JSON.parse(userData));
    const companyData = localStorage.getItem('company');
    if (companyData) setCompany(JSON.parse(companyData));

    // Fetch notifications
    fetch('/api/notifications?limit=10', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.success) setNotifications(d.data || []);
    }).catch(() => {});
  }, [router]);

  function handleLogout() {
    localStorage.clear();
    router.push('/');
  }

  if (!user) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-layout">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">☕</div>
          <div className="logo-text">B2B <span>Coffee</span></div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu chính</div>
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
            <span className="nav-icon">{collapsed ? '▶' : '◀'}</span>
            <span>Thu gọn</span>
          </button>
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <h2 className="header-title">
              {company?.name || 'Buyer Portal'}
            </h2>
          </div>
          <div className="header-right">
            <div style={{ position: 'relative' }}>
              <button className="header-btn" onClick={() => setShowNotif(!showNotif)}>
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>
              {showNotif && (
                <div className="notification-dropdown">
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 14 }}>Thông báo</strong>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{unreadCount} chưa đọc</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Chưa có thông báo</div>
                  ) : (
                    notifications.slice(0, 8).map((n) => (
                      <div key={n.id} className="notification-item">
                        <div className="notification-title">{n.title}</div>
                        <div className="notification-message">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="user-avatar" title={user.name}>
              {user.name?.charAt(0)?.toUpperCase() || 'B'}
            </div>
          </div>
        </header>

        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
