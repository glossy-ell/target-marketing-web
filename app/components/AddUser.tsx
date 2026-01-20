'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const AddUser = () => {
  const [name, setName] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  const [creatorRole, setCreatorRole] = useState<number | null>(null);
  const [creatorSeq, setCreatorSeq] = useState<number | null>(null);
  const [availableRoles, setAvailableRoles] = useState<number[]>([]);

  // 현재 로그인한 유저 정보 불러오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('인증 실패');
        const user = await res.json();

        setCreatorRole(Number(user.role));
        setCreatorSeq(user.seq);

        // 생성 가능 권한 설정
        if (user.role === 0) setAvailableRoles([1, 2, 3]);
        else if (user.role === 1) setAvailableRoles([2, 3]);
        else if (user.role === 2) setAvailableRoles([3]);
      } catch (err) {
        Swal.fire('인증 오류', '로그인 정보가 없거나 세션이 만료되었습니다.', 'error');
      }
    };

    fetchCurrentUser();
  }, []);

  const handleAddUser = async () => {
    if (!userId || !name || !password || selectedRole === null || creatorSeq === null) {
      Swal.fire('입력 오류', '모든 필드를 입력해주세요.', 'error');
      return;
    }

    const newUser = {
      id: userId,
      name,
      password,
      role: selectedRole,
      creatorSeq, // ✅ 백엔드는 seq 기준
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire('성공', '사용자가 추가되었습니다.', 'success');
        setUserId('');
        setName('');
        setPassword('');
        setSelectedRole(null);
      } else {
        Swal.fire('실패', data.error || '사용자 추가 실패', 'error');
      }
    } catch (err) {
      Swal.fire('오류', '서버 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">👤 새 사용자 추가</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="p-2 w-full border rounded-md"
        />
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 w-full border rounded-md"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 w-full border rounded-md"
        />
        <select
          value={selectedRole ?? ''}
          onChange={(e) => setSelectedRole(Number(e.target.value))}
          className="p-2 w-full border rounded-md"
        >
          <option value="">권한 선택</option>
          {availableRoles.map((r) => (
            <option key={r} value={r}>
              {r === 1 ? '총판' : r === 2 ? '대행사' : '사용자'}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddUser}
          className="w-full p-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
        >
          사용자 추가
        </button>
      </div>
    </div>
  );
};

export default AddUser;
