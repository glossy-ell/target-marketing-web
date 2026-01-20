'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      toast.error('아이디와 비밀번호를 입력하세요.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(' 성공!');
        router.replace('/slot-management');
      } else {
        const data = await response.json();
        toast.error(data.error || '로그인 실패');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      toast.error('알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105">

        <div className="w-full flex justify-center mb-6 h-20 overflow-hidden rounded-md">
          <img src="/logo.png" alt="logo" className="w-64 h-full object-cover" />
          {/* <video
            src="/logo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-64 h-full object-cover"
          /> */}
        </div>

        <input
          type="text"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-4 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
          className="w-full p-4 mb-6 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full p-4 bg-[#282828] text-white font-semibold rounded-md hover:bg-[#141414] transition-all duration-300 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>
    </>
  );
}
