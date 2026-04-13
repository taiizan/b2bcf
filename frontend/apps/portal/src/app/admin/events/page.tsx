'use client';

import { useEffect, useState } from 'react';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 2000); // Poll every 2 seconds for live feeling
    return () => clearInterval(interval);
  }, []);

  async function fetchEvents() {
    try {
      const token = localStorage.getItem('token');
      // notification-service handles /api/events in the gateway
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải events:', err);
    } finally {
      setLoading(false);
    }
  }

  const getEventBadgeClass = (type: string) => {
    if (type.includes('RFQ')) return 'status-submitted'; // blue-ish
    if (type.includes('QUOTE')) return 'status-quoted'; // orange
    if (type.includes('PO')) return 'status-accepted'; // green
    if (type.includes('INVENTORY')) return 'status-rejected'; // red
    if (type.includes('CHAT')) return 'status-delivering'; // purple
    return '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Luồng sự kiện Hệ thống (Event Bus)</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 14 }}>
            Giám sát thời gian thực các sự kiện giao tiếp giữa các Microservices (Event-Driven Architecture)
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchEvents} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔄</span> Làm mới
        </button>
      </div>

      <div className="card" style={{ background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}>
        <h3 className="card-title" style={{ color: '#fff', borderBottomColor: '#333' }}>Logs System Events</h3>
        
        {loading && events.length === 0 ? <p style={{ color: '#aaa' }}>Đang kết nối EventBus...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '65vh', overflowY: 'auto', paddingRight: 8 }}>
            {events.map((evt) => (
              <div key={evt.id} style={{
                background: '#2d2d2d',
                borderRadius: 8,
                padding: 16,
                borderLeft: '4px solid',
                borderLeftColor: evt.type.includes('PO') ? '#10b981' : 
                                 evt.type.includes('QUOTE') ? '#f59e0b' : 
                                 evt.type.includes('RFQ') ? '#3b82f6' : 
                                 evt.type.includes('CHAT') ? '#8b5cf6' : '#6b7280',
                fontFamily: 'monospace',
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 'bold',
                      color: evt.type.includes('PO') ? '#10b981' : 
                             evt.type.includes('QUOTE') ? '#f59e0b' : 
                             evt.type.includes('RFQ') ? '#3b82f6' : 
                             evt.type.includes('CHAT') ? '#c4b5fd' : '#fff'
                    }}>
                      {evt.type}
                    </span>
                    <span style={{ color: '#888' }}>→</span>
                    <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>Microservice: {evt.source}</span>
                  </div>
                  <div style={{ color: '#888' }}>
                    {new Date(evt.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div style={{
                  background: '#1a1a1a', padding: 12, borderRadius: 6, margin: 0,
                  whiteSpace: 'pre-wrap', color: '#d1d5db',
                  border: '1px solid #333'
                }}>
                  {JSON.stringify(evt.payload, null, 2)}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                Hệ thống chưa có sự kiện nào. Hãy thử chạy một luồng RFQ -> Quote từ Buyer.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
