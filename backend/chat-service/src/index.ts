// ═══════════════════════════════════════════════════════════════
// Chat Service — Real-time Price Negotiation via WebSocket
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import {
  EventBus, EventType, createEvent, type ChatMessagePayload,
} from '@b2b-coffee/event-schemas';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const PORT = process.env.PORT || 4004;
const eventBus = EventBus.getInstance();

// ── In-memory chat store (simulates MongoDB) ────────────────
interface ChatRoom {
  id: string;
  rfqId: string;
  participants: string[];
  createdAt: string;
}

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'price_offer' | 'sample_request' | 'attachment';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const chatDataFile = path.join(dataDir, 'chats.json');

function loadChatData(): { rooms: ChatRoom[]; messages: Message[] } {
  if (fs.existsSync(chatDataFile)) {
    return JSON.parse(fs.readFileSync(chatDataFile, 'utf-8'));
  }
  return { rooms: [], messages: [] };
}

function saveChatData(data: { rooms: ChatRoom[]; messages: Message[] }) {
  fs.writeFileSync(chatDataFile, JSON.stringify(data, null, 2));
}

// Initialize with seed data
let chatData = loadChatData();
if (chatData.rooms.length === 0) {
  chatData = {
    rooms: [
      { id: 'room-01', rfqId: 'rfq-01', participants: ['user-01', 'user-03'], createdAt: new Date().toISOString() },
      { id: 'room-02', rfqId: 'rfq-03', participants: ['user-01', 'user-02'], createdAt: new Date().toISOString() },
    ],
    messages: [
      { id: uuidv4(), roomId: 'room-01', senderId: 'user-01', senderName: 'Nguyễn Minh Tuấn', content: 'Chào anh Đức, bên mình cần báo giá 2 tấn Robusta Natural cho Q2. Giá hiện tại thế nào ạ?', type: 'text', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: uuidv4(), roomId: 'room-01', senderId: 'user-03', senderName: 'Phạm Văn Đức', content: 'Chào anh Tuấn! Giá FOB hiện tại cho lô 2 tấn là $3.80/kg. Nếu commit hợp đồng Q2-Q3 thì mình có thể giảm xuống $3.60/kg.', type: 'price_offer', metadata: { price: 3.60, unit: 'USD/kg', condition: 'Hợp đồng 2 quý' }, createdAt: new Date(Date.now() - 3000000).toISOString() },
      { id: uuidv4(), roomId: 'room-01', senderId: 'user-01', senderName: 'Nguyễn Minh Tuấn', content: 'Giá $3.60 khá hấp dẫn. Bên mình muốn xin mẫu thử 5kg trước khi chốt. Anh gửi được không?', type: 'sample_request', metadata: { quantity: 5, unit: 'kg' }, createdAt: new Date(Date.now() - 2400000).toISOString() },
      { id: uuidv4(), roomId: 'room-01', senderId: 'user-03', senderName: 'Phạm Văn Đức', content: 'Được anh! Mình sẽ gửi mẫu 5kg qua express, 2-3 ngày sẽ tới. Mình đính kèm profile cupping luôn nhé.', type: 'text', createdAt: new Date(Date.now() - 1800000).toISOString() },
    ],
  };
  saveChatData(chatData);
}

// ── REST Routes ──────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'chat-service', timestamp: new Date().toISOString() });
});

// List rooms for a user
app.get('/api/chat/rooms', (req, res) => {
  const { userId } = req.query;
  const data = loadChatData();

  // Auto-create global room
  if (!data.rooms.find(r => r.id === 'room-global')) {
    data.rooms.unshift({ id: 'room-global', rfqId: 'Global', participants: [], createdAt: new Date().toISOString() });
    saveChatData(data);
  }

  // Auto-create admin room per user
  if (userId && userId !== 'admin') {
    const adminRoomId = `room-admin-${userId}`;
    if (!data.rooms.find(r => r.id === adminRoomId)) {
      data.rooms.unshift({ id: adminRoomId, rfqId: 'Admin Support', participants: [userId as string, 'admin'], createdAt: new Date().toISOString() });
      saveChatData(data);
    }
  }

  const rooms = userId
    ? data.rooms.filter((r) => r.participants.includes(userId as string) || r.id === 'room-global' || (userId === 'admin' && r.id.startsWith('room-admin')))
    : data.rooms;

  const roomsWithLastMessage = rooms.map((r) => {
    const messages = data.messages.filter((m) => m.roomId === r.id);
    const lastMsg = messages[messages.length - 1];
    return { ...r, lastMessage: lastMsg?.content, lastMessageAt: lastMsg?.createdAt, messageCount: messages.length };
  });

  res.json({ success: true, data: roomsWithLastMessage });
});

// Get messages for a room
app.get('/api/chat/rooms/:roomId/messages', (req, res) => {
  const data = loadChatData();
  const messages = data.messages.filter((m) => m.roomId === req.params.roomId);
  res.json({ success: true, data: messages });
});

// Create or get room for an RFQ
app.post('/api/chat/rooms', (req, res) => {
  const { rfqId, participants } = req.body;
  const data = loadChatData();

  let room = data.rooms.find((r) => r.rfqId === rfqId);
  if (!room) {
    room = { id: `room-${uuidv4().slice(0, 8)}`, rfqId, participants, createdAt: new Date().toISOString() };
    data.rooms.push(room);
    saveChatData(data);
  }

  res.json({ success: true, data: room });
});

// ── WebSocket ────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Chat] 🔌 Client connected: ${socket.id}`);

  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
    console.log(`[Chat] 📥 ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data: { roomId: string; senderId: string; senderName: string; content: string; type?: string; metadata?: any }) => {
    const message: Message = {
      id: uuidv4(),
      roomId: data.roomId,
      senderId: data.senderId,
      senderName: data.senderName,
      content: data.content,
      type: (data.type as any) || 'text',
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
    };

    // Save to file store
    const chatStore = loadChatData();
    chatStore.messages.push(message);
    saveChatData(chatStore);

    // Broadcast to room
    io.to(data.roomId).emit('new_message', message);

    // Find room to get rfqId
    const room = chatStore.rooms.find((r) => r.id === data.roomId);

    // Publish event
    await eventBus.publish(createEvent<ChatMessagePayload>(EventType.CHAT_MESSAGE_SENT, 'chat-service', {
      roomId: data.roomId,
      rfqId: room?.rfqId || '',
      senderId: data.senderId,
      senderName: data.senderName,
      content: data.content,
      type: (data.type as any) || 'text',
    }));
  });

  socket.on('typing', (data: { roomId: string; userId: string; userName: string }) => {
    socket.to(data.roomId).emit('user_typing', { userId: data.userId, userName: data.userName });
  });

  socket.on('disconnect', () => {
    console.log(`[Chat] 🔌 Client disconnected: ${socket.id}`);
  });
});

// ── Start ────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`💬 Chat Service running on port ${PORT} (HTTP + WebSocket)`);
});

export default app;
