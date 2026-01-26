'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from "react";
import AgencyConfig from './AgencyConfig';
import DistributorConfig from './DistributorConfig';
import SystemConfig from './SystemConfig';
import UserConfig from './UserConfig';

interface User {
  seq: number;
  role: number;
  id: string;
  name: string;
  agencyId: string | null;
  agencySeq: number | null;
  distributorId: string | null;
  distributorSeq: number | null;
  excelAllow: boolean;
  slotAllow: boolean;
  userAllow: boolean;
  rankingCheckAllow: boolean;
  createdAt: string;
  agencyCount : number;
  userCount : number;
  slotCount : number;
}

interface Agency {
  seq: number;
  id: string;
  name: string;
}

interface Distributor {
  seq: number;
  id: string;
  name: string;
}

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number; excelAllow:number;  slotAllow:number; userAllow: number; rankingCheckAllow: number;} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agencyList, setAgencyList] = useState<Agency[]>([]);
  const [distributorList, setDistributorList] = useState<Distributor[]>([]);
  const [page, setPage] = useState(1);


  const [userData, setUserData] = useState<User[]>([]);
  const [agencyData, setAgencyData] = useState<User[]>([]);
  const [distributorData, setDistributorData] = useState<User[]>([]);


  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    password: '',
    role: 3,
    agencySeq: '',       // ← 여기가 현재 상태의 필드
    distributorSeq: '',  // ← 여기도
    seq: 0,
    excelAllow: 0,
    slotAllow: 0,
    userAllow: 0,
    rankingCheckAllow: 0,
  });

  const [configData, setConfigData] = useState({
    openStartTime: '',
    openEndTime: '',
    editStartTime: '',
    editEndTime: '',
  });


  const [weekendOpen, setWeekendOpen] = useState<boolean>(false);


  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfigData({
          openStartTime: data[0].value || '',
          openEndTime: data[1].value || '',
          editStartTime: data[2].value || '',
          editEndTime: data[3].value || '',
        });
      })
      .catch(err => console.error('config fetch error:', err));

    fetch('/api/weekend')
      .then(res => res.json())
      .then(data => {
        setWeekendOpen(Boolean(data[0].allow));
      })
      .catch(err => console.error('config fetch error:', err));

  }, []);



  const saveConfig = async () => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST', // 또는 PUT, 서버에 맞게
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      const res2 = await fetch('/api/weekend', {
        method: 'POST', // 또는 PUT, 서버에 맞게
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekendOpen }),
      });
      if (res2.status === 401) {
        window.location.href = '/';
        return;
      }

      if (res.ok && res2.ok) {
        alert('설정 저장 완료!');
      } else {
        const data = await res.json();
        alert('저장 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const [distributorSearchTerm, setDistributorSearchTerm] = useState('');
  const [distributorDropdownOpen, setDistributorDropdownOpen] = useState(false);

  // Agency 선택용
  const [agencySearchTerm, setAgencySearchTerm] = useState('');
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);

  // 필터링된 목록
  const filteredDistributors = distributorList.filter((dist: any) =>
    dist.name.includes(distributorSearchTerm) || dist.id.includes(distributorSearchTerm)
  );

  const filteredAgencies = agencyList.filter((agency: any) =>
    agency.name.includes(agencySearchTerm) || agency.id.includes(agencySearchTerm)
  );

  const distributorDropdownRef = useRef<HTMLDivElement>(null);
  const agencyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        distributorDropdownRef.current &&
        !distributorDropdownRef.current.contains(event.target as Node)
      ) {
        setDistributorDropdownOpen(false);
      }
      if (
        agencyDropdownRef.current &&
        !agencyDropdownRef.current.contains(event.target as Node)
      ) {
        setAgencyDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);




  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('로그인 정보 확인 실패');
        const user = await res.json();
        setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role),excelAllow: Number(user.excelAllow), slotAllow: Number(user.slotAllow),userAllow:Number(user.userAllow),rankingCheckAllow:Number(user.rankingCheckAllow)});
      } catch (err) {
        setError('로그인 정보가 없습니다.');
        window.location.href = '/';
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }
        if (!res.ok) throw new Error('유저 목록 불러오기 실패');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError('유저 데이터를 불러오는 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    // 대행 목록 불러오기
    fetch('/api/users/agencies')
      .then((res) => res.json())
      .then((data) => setAgencyList(data));

    // 총판 목록도 API로 따로 만들어서 불러온다고 가정
    fetch('/api/users/distributors')
      .then((res) => res.json())
      .then((data) => setDistributorList(data));
  }, []);


 useEffect(() => {
    // 대행 목록 불러오기
    if(formData.distributorSeq != '' && !isNaN(Number(formData.distributorSeq))){
    fetch(`/api/users/agencies?seq=${formData.distributorSeq}`)
      .then((res) => res.json())
      .then((data) => setAgencyList(data));
    }else{
          fetch('/api/users/agencies')
      .then((res) => res.json())
      .then((data) => setAgencyList(data));

    }


  }, [formData.distributorSeq]);

    useEffect(() => {
      if (formData.agencySeq) {
        const selectedAgency = agencyList.find(
          (agency: any) => agency.seq === Number(formData.agencySeq)
        );
        setAgencySearchTerm(
          selectedAgency ? `${selectedAgency.name} (${selectedAgency.id})` : ''
        );
      } else {
        setAgencySearchTerm('');
      }
    }, [formData.agencySeq, agencyList]);

  // 필터링
  const filteredUsers = users.filter((user) => {
    if (!currentUser) return false;

    if (currentUser.role === 0) return true;

    if (currentUser.role === 1) {
      return (
        user.agencySeq === currentUser.seq ||
        user.distributorSeq === currentUser.seq ||
        user.seq === currentUser.seq
      );
    }

    if (currentUser.role === 2) {
      return user.agencySeq === currentUser.seq || user.seq === currentUser.seq;
    }

    return false;
  });


  const totalPages = Math.ceil(filteredUsers.length / pageSize);



  const maxPageButtons = 5;
  const startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);
  const getRoleText = (role: number) => {
    switch (role) {
      case 0: return '관리자';
      case 1: return '총판';
      case 2: return '대행';
      case 3: return '클라이언트';
      default: return '알 수 없음';
    }
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // @ts-ignore
    const { name, value,checked} = e.target; //경고 무시

    if (name === 'excelAllow') {
      setFormData((prev) => ({ ...prev, excelAllow: checked ? 1 : 0 }));
      return; // 기존 로직 실행 안 하도록 종료
    }

    if (name === 'slotAllow') {
      setFormData((prev) => ({ ...prev, slotAllow: checked ? 1 : 0 }));
      return; // 기존 로직 실행 안 하도록 종료
    }
    if (name === 'userAllow') {
      setFormData((prev) => ({ ...prev, userAllow: checked ? 1 : 0 }));
      return; // 기존 로직 실행 안 하도록 종료
    }
    if (name === 'rankingCheckAllow') {
      setFormData((prev) => ({ ...prev, rankingCheckAllow: checked ? 1 : 0 }));
      return; // 기존 로직 실행 안 하도록 종료
    }
    setFormData((prev) => ({ ...prev, [name]: name === 'role' ? Number(value) : value }));
  };

  const handleSubmit = async () => {
    try {
      if (!currentUser) return;

      if(currentUser == null || !currentUser.slotAllow){
        alert(`권한이 없습니다`);
        return;
      }


      if (formMode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, creatorSeq: currentUser.seq }),
        });
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          alert(`등록 실패: ${data.error || data.message}`);
        } else {
          alert('등록 성공!');
          window.location.reload();
        }
      } else if (formMode === 'edit') {
        const targetUser = users.find(u => u.seq === formData.seq);
        if (!targetUser) return;

        const res = await fetch('/api/users/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userSeq: formData.seq,
            name:formData.name,
            password: formData.password,
            editorSeq: currentUser.seq,
            agencySeq: formData.agencySeq !== ''
              ? Number(formData.agencySeq)
              : targetUser.agencySeq,
            distributorSeq: formData.distributorSeq !== ''
              ? Number(formData.distributorSeq)
              : targetUser.distributorSeq,
            role: typeof formData.role === 'number' && !isNaN(formData.role)
              ? formData.role
              : targetUser.role,
            excelAllow: formData.excelAllow,
            userAllow: formData.userAllow,
            slotAllow: formData.slotAllow,
            rankingCheckAllow: formData.rankingCheckAllow,
          }),

        });
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          alert(`수정 실패: ${data.error || data.message}`);
        } else {
          alert('수정 성공!');
          window.location.reload();
        }
      }
    } catch (err) {
      console.error(err);
      alert('요청 중 오류 발생');
    }
  };

  const handleEditClick = (user: User) => {
    setFormMode('edit');
    setFormData({
      id: user.id,
      name: user.name,
      password: '',
      role: user.role,
      excelAllow: user.excelAllow == true ? 1:0,
      slotAllow : user.slotAllow == true ? 1:0,
      userAllow : user.userAllow == true ? 1:0,
      rankingCheckAllow : user.rankingCheckAllow == true ? 1:0,
      agencySeq: user.agencySeq ? String(user.agencySeq) : '',
      distributorSeq: user.distributorSeq ? String(user.distributorSeq) : '',
      seq: user.seq,
    });

    const selectedDistributor = distributorList.find((dist: any) => dist.seq === user.distributorSeq);
      setDistributorSearchTerm(
        selectedDistributor ? `${selectedDistributor.name} (${selectedDistributor.id})` : ''
      );

      const selectedAgency = agencyList.find((agency: any) => agency.seq === user.agencySeq);
      setAgencySearchTerm(
        selectedAgency ? `${selectedAgency.name} (${selectedAgency.id})` : ''
      );

  };

   const handleDeleteClick = async (seq:number) => {


    if(confirm("정말로 삭제하시겠습니까?")){
      try{
          const res = await fetch(`/api/users/delete/${seq}`, {method: 'DELETE'});
          if (!res.ok) throw new Error('삭제 실패');

          alert('삭제되었습니다.');
          window.location.reload();
      } catch (err) {
        setError('삭제 중 오류가 발생하였습니다.');
      }
    }
    return;
  };



  if (loading) return <div className="p-4 text-center">🔄 로딩 중...</div>;
  if (error) return <div className="p-4 text-center text-red-600">⚠ {error}</div>;

  return (
    <div className="p-4">

      {/* 등록/수정 폼 */}
      <div style={{ display: (currentUser!.role == 0 || currentUser!.role == 1) ? '' : 'none' }} className="mb-6 border p-4 rounded shadow-sm bg-gray-50">
        <h3 className="font-semibold mb-2">
          {formMode === 'create' ? '📝 유저 등록' : '✏ 유저 수정'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            name="id"
            placeholder="아이디"
            value={formData.id}
            onChange={handleInputChange}
            className="border p-2"
            disabled={formMode === 'edit'}
          />
          <input
            type="text"
            name="name"
            placeholder="이름"
            value={formData.name}
            onChange={handleInputChange}
            className="border p-2"
          />

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            value={formData.password}
            onChange={handleInputChange}
            className="border p-2"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="border px-2 py-1 h-11 text-base rounded"
          >
            <option value={0} style={{ display: (currentUser!.role == 0 ) ? '' : 'none' }}>관리자</option>
            <option value={1} style={{ display: (currentUser!.role == 0 ) ? '' : 'none' }}>총판</option>
            <option value={2} style={{ display: (currentUser!.role == 0 || currentUser!.role == 1) ? '' : 'none' }}>대행</option>
            <option value={3}>클라이언트</option>
          </select>

          {/* 총판 선택 */}
          {currentUser?.role === 0 && (formData.role == 2 || formData.role == 3) && (
            <div className="relative" ref={distributorDropdownRef}>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="총판 이름 또는 ID로 검색"
                value={distributorSearchTerm}
                onChange={(e) => {
                  setDistributorSearchTerm(e.target.value);
                  setDistributorDropdownOpen(true);
                }}
                onFocus={() => setDistributorDropdownOpen(true)}
              />

              {formData.distributorSeq && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, distributorSeq: '' });
                    setDistributorSearchTerm('');
                    setDistributorDropdownOpen(true);
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}

              {distributorDropdownOpen && (
                <ul className="absolute w-full border rounded max-h-40 overflow-y-auto bg-white z-10 mt-1 shadow">
                  {filteredDistributors.length === 0 ? (
                    <li className="p-2 text-gray-500">검색 결과 없음</li>
                  ) : (
                    filteredDistributors.map((dist: any) => (
                      <li
                        key={dist.seq}
                        className={`p-2 cursor-pointer hover:bg-gray-100 ${
                          formData.distributorSeq === dist.seq ? 'bg-gray-200' : ''
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, distributorSeq: dist.seq });
                          setDistributorSearchTerm(`${dist.name} (${dist.id})`);
                          setDistributorDropdownOpen(false);
                        }}
                      >
                        {dist.name} ({dist.id})
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}


          {/* 대행 선택 */}
          {(currentUser?.role === 0 || currentUser?.role === 1) && formData.role == 3 && (
            <div className="relative" ref={agencyDropdownRef}>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="대행 이름 또는 ID로 검색"
                value={agencySearchTerm}
                onChange={(e) => {
                  setAgencySearchTerm(e.target.value);
                  setAgencyDropdownOpen(true);
                }}
                onFocus={() => setAgencyDropdownOpen(true)}
              />

              {formData.agencySeq && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, agencySeq: '' });
                    setAgencySearchTerm('');
                    setAgencyDropdownOpen(true);
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}

              {agencyDropdownOpen && (
                <ul className="absolute w-full border rounded max-h-40 overflow-y-auto bg-white z-10 mt-1 shadow">
                  {filteredAgencies.length === 0 ? (
                    <li className="p-2 text-gray-500">검색 결과 없음</li>
                  ) : (
                    filteredAgencies.map((agency: any) => (
                      <li
                        key={agency.seq}
                        className={`p-2 cursor-pointer hover:bg-gray-100 ${
                          formData.agencySeq === agency.seq ? 'bg-gray-200' : ''
                        }`}
                        onClick={() => {
                          setFormData({ ...formData, agencySeq: agency.seq });
                          setAgencySearchTerm(`${agency.name} (${agency.id})`);
                          setAgencyDropdownOpen(false);
                        }}
                      >
                        {agency.name} ({agency.id})
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="flex gap-4 items-center">
            {currentUser?.role === 0  ? (
               <label className="inline-flex gap-1 cursor-pointer">
                <span>엑셀 허용</span>
                <input
                  type="checkbox"
                  name="excelAllow"
                  checked={formData.excelAllow === 1}
                  onChange={handleInputChange}
                  className="border p-2 cursor-pointer accent-[#282828]"
                />
              </label>
            ):null}

         

            {currentUser?.role === 0 ? (
               <label className="inline-flex gap-1 cursor-pointer">
                <span>순위체크 허용 </span>
                <input
                  type="checkbox"
                  name="rankingCheckAllow"
                  checked={formData.rankingCheckAllow ===1 }
                  onChange={handleInputChange}
                  className="border p-2 cursor-pointer accent-[#282828]"
                />
              </label>
            ):null}


            {currentUser?.role === 0 ? (
              <label  className="inline-flex gap-1 cursor-pointer"
               style={{ display: (currentUser?.role === 0 && formData.role !=3 )  ? '' : 'none' }}>

              <span>슬롯 오픈 허용</span>
              <input
                type="checkbox"
                name="slotAllow"
                checked={formData.slotAllow ===1 }
                onChange={handleInputChange}
                className="border p-2 cursor-pointer accent-[#282828]"
              />
              </label>
            ):null}

            {currentUser?.role === 0 ? (
              <label   className="inline-flex gap-1 cursor-pointer"  style={{ display: (currentUser?.role === 0 && formData.role !=3 )   ? '' : 'none' }}  >
              <span>계정 추가 허용 </span>
              <input

                type="checkbox"
                name="userAllow"
                checked={formData.userAllow ==1 }
                onChange={handleInputChange}
                className="border p-2 cursor-pointer accent-[#282828]"
              />
              </label>
            ):null}


          </div>
        </div>
           <div>
            {formMode === 'edit' ?
              <span>권한 수정은 재로그인을 해야 적용됩니다.</span>
            :<></>}
            </div>

        <div className="mt-4">
          <button
            onClick={handleSubmit}
            className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded"
          >
            {formMode === 'create' ? '등록' : '수정'}
          </button>
          {formMode === 'edit' && (
            <button
              onClick={() => {
                setFormMode('create');
                setFormData({
                  id: '',
                  name: '',
                  password: '',
                  role: 3,
                  agencySeq: '',
                  excelAllow: 0,
                  slotAllow:0,
                  userAllow:0,
                  rankingCheckAllow:0,
                  distributorSeq: '',
                  seq: 0,
                });
              }}
              className="ml-2 text-gray-600 underline"
            >
              취소
            </button>
          )}
        </div>
      </div>

      {/* 🔧 관리자 전용 설정 영역 */}
      {currentUser?.role === 0 && (
        <SystemConfig
          weekendOpen={weekendOpen}
          setWeekendOpen={setWeekendOpen}
          configData={configData}
          setConfigData={setConfigData}
          saveConfig={saveConfig}
        />
      )}

      {currentUser?.role === 0   && (
        <DistributorConfig
           users={distributorData}
        />
      )}

    {(currentUser?.role === 0 || currentUser?.role === 1) && (
      <AgencyConfig users={agencyData} />
    )}

    {(currentUser?.role !=3) && (
      <UserConfig users={userData} />
    )}




      {/* 유저 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="text-xs min-w-full text-center bg-white rounded-lg overflow-hidden border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-4 border-b border-gray-300">번호</th>
              <th className="px-5 py-4 border-b border-gray-300">역할</th>
              <th className="px-5 py-4 border-b border-gray-300">총판</th>
              <th className="px-5 py-4 border-b border-gray-300">대행</th>
              <th className="px-5 py-4 border-b border-gray-300">아이디</th>
              <th className="px-5 py-4 border-b border-gray-300">이름</th>
              <th className="px-5 py-4 border-b border-gray-300"
               style={{ display: currentUser?.role === 0  ? '' : 'none' }}
              >권한</th>
              <th className="px-5 py-4 border-b border-gray-300">수정</th>
              <th className="px-5 py-4 border-b border-gray-300">삭제</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.seq} className="hover:bg-gray-50">
                <td className="border p-2">{user.seq}</td>
                <td className="border p-2">{getRoleText(user.role)}</td>
                <td className="border p-2">{user.distributorId || '-'}</td>
                <td className="border p-2">{user.agencyId || '-'}</td>
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.name}</td>
                <td className="border p-2"   style={{ display: currentUser?.role === 0  ? '' : 'none' }}>
                  {user.userAllow==true && (
                    <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                      계정
                    </span>
                  )}
                  {user.slotAllow==true && (
                    <span className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
                      슬롯
                    </span>
                  )}
                  {user.excelAllow==true && (
                    <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full">
                      엑셀
                    </span>
                  )}
    
                  {user.rankingCheckAllow==true && (
                    <span className="bg-[#282828] text-white text-sm px-3 py-1 rounded-full">
                      순위체크
                    </span>
                  )}
                </td>
                <td className="border p-2">
                  <button style={{ display: (currentUser!.role == 0 || currentUser!.role == 1) ? '' : 'none' }} onClick={() => handleEditClick(user)} className="text-[#282828] underline text-sm" >
                    수정
                  </button>
                </td>
                  <td className="border p-2">
                  <button style={{ display: (currentUser!.seq == user.seq ) ? 'none' : '' }} onClick={() => handleDeleteClick(user.seq)} className="text-[#282828] underline text-sm" >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 UI */}
        <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
          <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              onClick={() => setPage(p)}
              className={`px-3 py-1 text-sm hover:bg-[#141414] ${p === page ? 'bg-[#282828] text-white' : 'text-gray-600 hover:text-white'}`}
            >
              {p}
            </Button>
          ))}

          <Button variant="ghost" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserList;
