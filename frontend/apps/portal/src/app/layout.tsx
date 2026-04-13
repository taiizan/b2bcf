import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'B2B Coffee Wholesale — Buyer Portal',
  description: 'Nền tảng mua sỉ cà phê B2B cho Chuỗi F&B, Nhà hàng và Doanh nghiệp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
