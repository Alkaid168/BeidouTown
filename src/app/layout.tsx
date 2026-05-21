import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '北斗镇',
  description: '一个神秘夜色气质的网页小镇。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
