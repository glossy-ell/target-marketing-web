'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Footer from './Footer';

const noLayoutPaths = ['/','/exceldownloadpopup','/exceltotaldownloadpopup','/excelspecdownloadpopup','/exceluploadpopup','/fixpopup']; // 필요한 예외 경로 추가

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldHideLayout = noLayoutPaths.includes(pathname);

  if (shouldHideLayout) return <main>{children}</main>;

  return (
    <div className="flex min-h-screen bg-white text-black">
      <div className="w-64 bg-gray-900 text-white hidden xl:block">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-x-hidden">
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
