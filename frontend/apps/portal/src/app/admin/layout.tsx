'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV = [
  { label: 'Tổng quan hệ thống', icon: '📊', href: '/admin/dashboard' },
  { label: 'Quản lý người dùng', icon: '👥', href: '/admin/users' },
  { label: 'Luồng sự kiện', icon: '⚡', href: '/admin/events' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!t || !u) { router.push('/'); return; }
    setUser(JSON.parse(u));
  }, [router]);

  if (!user) return null;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>⚙️</div>
          <div className="logo-text">Admin <span>Panel</span></div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Quản trị</div>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: '1px solid var(--glass-border)' }}>
          <button className="nav-item" onClick={() => { localStorage.clear(); router.push('/'); }}>
            <span className="nav-icon">🚪</span><span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="header">
          <div className="header-left"><h2 className="header-title">⚙️ Admin Dashboard</h2></div>
          <div className="header-right">
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>{user.name?.charAt(0)}</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
