import type { Metadata } from 'next';
import localFont from 'next/font/local';
import LayoutWrapper from './components/common/LayoutWrapper'; // 클라이언트 컴포넌트
import './globals.css';

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: 'TARGET MARKETING',
  description: 'Online E-Commerce',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="kr">
      <body className={`${pretendard.variable} antialiased bg-white text-black`}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
