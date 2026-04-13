'use client';
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const token = localStorage.getItem('token');
      // Fetch users from user-service
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải người dùng:', err);
    } finally {
      setLoading(false);
    }
  }

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN': return '#ef4444';
      case 'BUYER': return '#3b82f6';
      case 'SUPPLIER': return '#10b981';
      default: return '#888';
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1>👥 Quản lý Người Dùng</h1>
          <p>Danh sách các tài khoản trên hệ thống B2B Coffee Portal</p>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Tất cả Người Dùng</h3>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>TÊN / DOANH NGHIỆP</th>
                <th>EMAIL</th>
                <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY TẠO</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.id.substring(0, 8)}...</td>
                  <td>
                    <strong>{user.name}</strong>
                    {user.companyName && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.companyName}</div>}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                      background: `${getRoleColor(user.role)}22`, color: getRoleColor(user.role) 
                    }}>
                      {user.role?.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: user.isActive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {user.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
