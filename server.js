// ═══════════════════════════════════════════════════════════════
// Combined Production Server — Gộp tất cả services vào 1 process
// Giúp tiết kiệm RAM cho Free Tier hosting (512MB)
// ═══════════════════════════════════════════════════════════════

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Tạo thư mục data cho SQLite (nếu chưa có)
const services = ['user-service', 'rfq-service', 'order-service', 'chat-service', 'notification-service', 'ai-service'];
services.forEach(service => {
  const dataDir = path.join(__dirname, 'backend', service, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created data directory: ${dataDir}`);
  }
});

// Set ports cho từng service
process.env.PORT = '4001';
require('./backend/user-service/dist/index.js');

setTimeout(() => {
  process.env.PORT = '4002';
  require('./backend/rfq-service/dist/index.js');
}, 500);

setTimeout(() => {
  process.env.PORT = '4003';
  require('./backend/order-service/dist/index.js');
}, 1000);

setTimeout(() => {
  process.env.PORT = '4004';
  require('./backend/chat-service/dist/index.js');
}, 1500);

setTimeout(() => {
  process.env.PORT = '4005';
  require('./backend/notification-service/dist/index.js');
}, 2000);

setTimeout(() => {
  process.env.PORT = '4006';
  require('./backend/ai-service/dist/index.js');
}, 2500);

// API Gateway khởi động cuối cùng (chờ tất cả services sẵn sàng)
setTimeout(() => {
  process.env.PORT = process.env.GATEWAY_PORT || '10000';
  require('./backend/api-gateway/dist/index.js');
}, 3500);
