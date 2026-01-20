'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiLogOut, FiUser } from 'react-icons/fi';

export default function Sidebar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<number | null>(null);

  const [userAllow, setUserAllow] = useState<number | null>(null);
  const [slotAllow, setSlotAllow] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserInfo = async () => {
    try {
      const res = await fetch('/api/me', {
        credentials: 'include',
      });

      if (!res.ok) throw new Error('인증 실패');

      const user = await res.json();
      setIsLoggedIn(true);
      setUserName(user.name);
      setUserRole(Number(user.role));
      setUserAllow(Number(user.userAllow));
      setSlotAllow(Number(user.slotAllow));
    } catch (err) {
      setIsLoggedIn(false);
      setUserName(null);
      setUserRole(null);
      setUserAllow(null);
      setSlotAllow(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'include',
    });

    setIsLoggedIn(false);
    setUserName(null);
    setUserRole(null);
    router.push('/');
  };

  // 현재 경로와 링크 경로 비교해서 active 클래스 주기 함수
  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-white z-50 text-gray-800 shadow-lg flex flex-col justify-between py-6 px-4 z-50">
      <div>
        <Link href="/">
          <div className="w-full flex justify-center mb-6 h-20 overflow-hidden rounded-md cursor-pointer">
            <video
              src="/logo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-64 h-full object-cover"
            />
          </div>
        </Link>

        {!loading && isLoggedIn && (
          <nav className="flex flex-col gap-2">
            <Link
              href="/slot-management"
              className={`px-4 py-3 rounded transition-all ${
                isActive('/slot-management')
                  ? 'bg-[#6449FC] text-white font-semibold shadow-md'
                  : 'hover:bg-gray-200'
              }`}
            >
              슬롯관리
            </Link>

            {((userRole === 0 || userRole === 1|| userRole === 2)&& slotAllow == 1) && (
              <Link
                href="/add-slot"
                className={`px-4 py-3 rounded transition-all ${
                  isActive('/add-slot')
                    ? 'bg-[#6449FC] text-white font-semibold shadow-md'
                    : 'hover:bg-gray-200'
                }`}
              >
                슬롯단일추가
              </Link>
            )}


            {((userRole === 0 || userRole === 1 || userRole === 2)&&userAllow ==1) && (
              <Link
                href="/user-management"
                className={`px-4 py-3 rounded transition-all ${
                  isActive('/user-management')
                    ? 'bg-[#6449FC] text-white font-semibold shadow-md'
                    : 'hover:bg-gray-200'
                }`}
              >
                사용자관리
              </Link>
            )}
            
            {(userRole === 0 ) && (
              <Link
                href="/extend-management"
                className={`px-4 py-3 rounded transition-all ${
                  isActive('/extend-management')
                    ? 'bg-[#6449FC] text-white font-semibold shadow-md'
                    : 'hover:bg-gray-200'
                }`}
              >
                연장관리
              </Link>
            )}


               {(userRole === 0 || userRole === 1 || userRole === 2) && (
              <Link
                href="/log"
                className={`px-4 py-3 rounded transition-all ${
                  isActive('/log')
                    ? 'bg-[#6449FC] text-white font-semibold shadow-md'
                    : 'hover:bg-gray-200'
                }`}
              >
                로그
              </Link>
            )}

          </nav>
        )}
      </div>

      {!loading && isLoggedIn && (
        <div className="border-t border-gray-200 pt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 shadow-sm w-full justify-center">
            <FiUser className="text-gray-500" size={20} />
            <span className="font-medium text-gray-700 truncate max-w-[140px]">
              {userName}님
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors font-semibold"
          >
            <FiLogOut size={18} />
            로그아웃
          </button>
        </div>
      )}
    </aside>
  );
}
