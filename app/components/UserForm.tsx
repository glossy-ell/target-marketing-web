'use client';

import { useEffect, useState } from 'react';

interface Props {
  mode: 'create' | 'edit';
  initialData?: Partial<User>;
  currentUser: { seq: number; role: number };
  onSuccess: () => void;
}

const UserForm = ({ mode, initialData = {}, currentUser, onSuccess }: Props) => {
  const [id, setId] = useState(initialData.id || '');
  const [name, setName] = useState(initialData.name || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialData.role ?? 3);
  const [agencyId, setAgencyId] = useState<string | null>(initialData.agencyId || null);
  const [distributorId, setDistributorId] = useState<string | null>(initialData.distributorId || null);
  const [agencies, setAgencies] = useState<User[]>([]);
  const [distributors, setDistributors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      const [agRes, disRes] = await Promise.all([
        fetch('/api/users/agencies'),
        fetch('/api/users/distributors'),
      ]);
      setAgencies(await agRes.json());
      setDistributors(await disRes.json());
    };
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id,
      name,
      password: password || undefined,
      role,
      creatorSeq: currentUser.seq,
      agencyId,
      distributorId,
      userId: initialData.id, // edit 시 필요
      editorId: currentUser.seq,
    };

    const method = mode === 'create' ? 'POST' : 'PUT';
    const res = await fetch('/api/users', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      onSuccess();
    } else {
      alert('오류 발생');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-gray-50">
      {mode === 'create' && (
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" required className="w-full p-2 border rounded" />
      )}
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" required className="w-full p-2 border rounded" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" type="password" className="w-full p-2 border rounded" />

      <select value={role} onChange={(e) => setRole(Number(e.target.value))} className="w-full p-2 border rounded">
        <option value={1}>총판</option>
        <option value={2}>대행</option>
        <option value={3}>사용자</option>
      </select>

      <select value={distributorId || ''} onChange={(e) => setDistributorId(e.target.value || null)} className="w-full p-2 border rounded">
        <option value="">총판 선택</option>
        {distributors.map((u) => (
          <option key={u.seq} value={u.seq}>{u.name} ({u.id})</option>
        ))}
      </select>

      <select value={agencyId || ''} onChange={(e) => setAgencyId(e.target.value || null)} className="w-full p-2 border rounded">
        <option value="">대행 선택</option>
        {agencies.map((u) => (
          <option key={u.seq} value={u.seq}>{u.name} ({u.id})</option>
        ))}
      </select>

      <button disabled={loading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        {mode === 'create' ? '등록' : '수정'}
      </button>
    </form>
  );
};

export default UserForm;
