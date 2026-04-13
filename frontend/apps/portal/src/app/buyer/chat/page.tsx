'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.id) return;
    setUser(userData);

    // Initialize Socket.io connection (chat-service on 4004)
    const socket = io('http://localhost:4004');
    socketRef.current = socket;

    socket.on('connect', () => console.log('Connected to Chat WS'));
    socket.on('new_message', (msg: any) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    fetchRooms(userData.id);

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchRooms(userId: string) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/chat/rooms?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRooms(data.data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  }

  async function fetchMessages(roomId: string) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }

  function handleSelectRoom(room: any) {
    setActiveRoom(room);
    fetchMessages(room.id);
    socketRef.current?.emit('join_room', room.id);
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom || !user || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      roomId: activeRoom.id,
      senderId: user.id,
      senderName: user.name,
      content: inputText,
      type: 'text'
    });

    setInputText('');
  }

  return (
    <div style={{ display: 'flex', height: '80vh', gap: 24 }}>
      {/* Sidebar: Room List */}
      <div className="card" style={{ width: 320, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: 18, margin: 0 }}>Thương lượng (Chat)</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rooms.map(room => (
            <div 
              key={room.id}
              onClick={() => handleSelectRoom(room)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--glass-border)',
                cursor: 'pointer',
                background: activeRoom?.id === room.id ? 'var(--input-bg)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {room.id === 'room-global' ? '🌍 Chợ chung (Global)' : room.id.startsWith('room-admin') ? '🛡️ Liên hệ Admin' : `Phòng RFQ: ${room.rfqId}`}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {room.lastMessage || 'Chưa có tin nhắn'}
              </div>
            </div>
          ))}
          {rooms.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Không có phòng chat nào</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {activeRoom ? (
          <>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--input-bg)' }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {activeRoom.id === 'room-global' ? '🌍 Chợ chung giữa Suppliers & Buyers' : activeRoom.id.startsWith('room-admin') ? '🛡️ Kênh hỗ trợ Admin' : `Đang thương lượng cho RFQ: ${activeRoom.rfqId}`}
              </h3>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                {activeRoom.id === 'room-global' ? 'Mọi người đều có thể tham gia' : `Tham gia: ${activeRoom.participants.join(', ')}`}
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg: any) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%'
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textAlign: isMe ? 'right' : 'left' }}>
                      {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 16,
                      background: isMe ? 'var(--primary-color)' : 'var(--input-bg)',
                      color: isMe ? '#fff' : 'var(--text-color)',
                      borderBottomRightRadius: isMe ? 4 : 16,
                      borderBottomLeftRadius: isMe ? 16 : 4,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {msg.type === 'price_offer' && (
                        <div style={{ marginBottom: 8, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                          <strong>Đề xuất giá:</strong> {msg.metadata?.price} {msg.metadata?.unit} ({msg.metadata?.condition})
                        </div>
                      )}
                      {msg.type === 'sample_request' && (
                        <div style={{ marginBottom: 8, padding: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                          <strong>Yêu cầu mẫu thử:</strong> {msg.metadata?.quantity} {msg.metadata?.unit}
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 20, borderTop: '1px solid var(--glass-border)' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, borderRadius: 24, padding: '12px 20px' }}
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 24, padding: '0 24px' }}>
                  Gửi 📤
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Chọn một phòng chat để bắt đầu thương lượng
          </div>
        )}
      </div>
    </div>
  );
}
