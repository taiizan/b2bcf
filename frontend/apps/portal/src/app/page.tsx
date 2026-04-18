'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function LoginPage() {
  const container = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<'BUYER' | 'SUPPLIER' | 'ADMIN'>('BUYER');
  
  // Auto-fill based on role
  const credentials = {
    BUYER: { email: 'buyer@highland.vn', password: 'password123' },
    SUPPLIER: { email: 'farmer@daklak.vn', password: 'password123' },
    ADMIN: { email: 'admin@b2bcoffee.vn', password: 'password123' }
  };

  const [email, setEmail] = useState(credentials.BUYER.email);
  const [password, setPassword] = useState(credentials.BUYER.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // GSAP Choreography
  useGSAP(() => {
    const tl = gsap.timeline();
    // Card entrance
    tl.from('.login-card', {
      scale: 0.95,
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      clearProps: 'opacity,transform'
    });
    // Stagger all items inside
    tl.from('.gsap-stagger', {
      y: 15,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
      clearProps: 'opacity,transform'
    }, "-=0.4");
  }, { scope: container });

  const handleRoleChange = (newRole: 'BUYER' | 'SUPPLIER' | 'ADMIN') => {
    setRole(newRole);
    setEmail(credentials[newRole].email);
    setPassword(credentials[newRole].password);
    setError('');
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('company', JSON.stringify(data.data.company));
        
        // Smart routing based on authenticated role
        const userRole = data.data.user.role.toLowerCase();
        router.push(`/${userRole}/dashboard`);
      } else {
        setError(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      setError('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page" ref={container}>
      <div className="login-card" style={{ maxWidth: 440 }}>
        <div className="gsap-stagger" style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #c47f1a, #e5b96e)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 16,
            boxShadow: '0 8px 16px rgba(196, 127, 26, 0.2)'
          }}>☕</div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px 0', color: 'var(--text-color)' }}>B2B <span style={{ color: '#c47f1a' }}>Coffee</span></h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Nền tảng thương mại sỉ cà phê hợp nhất</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="gsap-stagger" style={{ display: 'flex', gap: 8, marginBottom: 24, background: 'var(--bg-card)', padding: 6, borderRadius: 12, border: '1px solid var(--glass-border)' }}>
          {['BUYER', 'SUPPLIER', 'ADMIN'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r as any)}
              style={{
                flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
                background: role === r ? 'var(--input-bg)' : 'transparent',
                color: role === r ? (r==='ADMIN'?'#3b82f6':r==='SUPPLIER'?'#c47f1a':'#e5b96e') : 'var(--text-muted)',
                boxShadow: role === r ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                borderBottom: role === r ? `2px solid ${r==='ADMIN'?'#3b82f6':r==='SUPPLIER'?'#c47f1a':'#e5b96e'}` : '2px solid transparent'
              }}
            >
              {r === 'BUYER' ? '🛒 Buyer' : r === 'SUPPLIER' ? '🏭 Supplier' : '⚙️ Admin'}
            </button>
          ))}
        </div>

        {error && (
          <div className="gsap-stagger" style={{
            background: 'rgba(232, 69, 69, 0.12)', border: '1px solid rgba(232, 69, 69, 0.3)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 20,
            color: '#e84545', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group gsap-stagger" style={{ marginBottom: 16 }}>
            <label className="form-label">Tài khoản Email ({role})</label>
            <input className="form-input" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required 
              style={{ fontSize: 15, padding: '12px 16px' }}/>
          </div>
          <div className="form-group gsap-stagger" style={{ marginBottom: 24 }}>
            <label className="form-label">Mật khẩu</label>
            <input className="form-input" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required 
              style={{ fontSize: 15, padding: '12px 16px' }}/>
          </div>
          
          <button className="btn btn-primary gsap-stagger" type="submit" disabled={loading} 
            style={{ 
              width: '100%', padding: '14px', fontSize: 15, fontWeight: 600,
              background: role === 'ADMIN' ? 'linear-gradient(135deg, #2563eb, #06b6d4)' : 
                          role === 'SUPPLIER' ? 'linear-gradient(135deg, #854c12, #c47f1a)' : 
                          'linear-gradient(135deg, #c47f1a, #e5b96e)',
              border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
            {loading ? '⏳ Đang xác thực...' : `🚀 Đăng nhập ${role === 'BUYER' ? 'Buyer' : role === 'SUPPLIER' ? 'Supplier' : 'Admin'}`}
          </button>
        </form>
      </div>
    </div>
  );
}
