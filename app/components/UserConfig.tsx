import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';


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
  price:number;
}

type Props = {
  users: User[];
};

export default function AgencyConfig(props: Props) {

  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number; excelAllow:number;  slotAllow:number; userAllow: number;rankingCheckAllow:number;} | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [page, setPage] = useState(1);
  const [excelLocalSwitchState, setExcelLocalSwitchState] = useState<{ [key: number]: boolean }>({});
  const [regLocalSwitchState, setRegLocalSwitchState] = useState<{ [key: number]: boolean }>({});
  const [rankingLocalSwitchState, setRankingLocalSwitchState] = useState<{ [key: number]: boolean }>({});
  const [editRow, setEditRow] = useState<number | null>(null);
  const [price,setPrice] = useState<number>(-1);

  useEffect(() => {
     const fetchCurrentUser = async () => {
       try {
         const res = await fetch('/api/me', { credentials: 'include' });
         if (!res.ok) throw new Error('로그인 정보 확인 실패');
         const user = await res.json();
         setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role),excelAllow: Number(user.excelAllow),  slotAllow: Number(user.slotAllow),userAllow:Number(user.userAllow),rankingCheckAllow:Number(user.rankingCheckAllow)});
       } catch (err) {
         setError('로그인 정보가 없습니다.');
       }
     };

     fetchCurrentUser();
   }, []);

  const handleSubmit = async (seq:number) => {
      try {
        if (!currentUser) return;

        if(currentUser == null || currentUser.role ==3){
          alert(`권한이 없습니다`);
          return;
        }

        const res = await fetch('/api/users/update/price', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userSeq: seq,
            editorSeq: currentUser.seq,
            price: price,
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
          alert('수정되었습니다.');
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        alert('요청 중 오류 발생');
      }
    };


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
  });

    useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users/user');
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

  const pageSize = 5;

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

  useEffect(() => {
    const initialState: { [key: number]: boolean } = {};
    users.forEach(user => {
      initialState[user.seq] = user.excelAllow;
    });
    setExcelLocalSwitchState(initialState);
  }, [users]);



  useEffect(() => {
    const initialState: { [key: number]: boolean } = {};
    users.forEach(user => {
      initialState[user.seq] = user.rankingCheckAllow;
    });
    setRankingLocalSwitchState(initialState);
  }, [users]);


  const handleChangeRole = async (seq:number, role:boolean,roleName:string) => {
    try {
      if (!currentUser) return;

      if(currentUser == null || currentUser.role == 3){
        alert(`권한이 없습니다`);
        return;
      }
        const res = await fetch('/api/users/update/role', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userSeq: seq,
            editorSeq: currentUser.seq,
            [roleName]: role,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(`오류가 발생했습니다 : ${data.error || data.message}`);
        }
    } catch (err) {
      console.error(err);
      alert('요청 중 오류 발생');
    }
  };


  return (
    <div className="col-span-2 mt-4 mb-4 p-4 border rounded bg-white shadow-sm cursor-pointer"
    onClick={(e) => {
      // 정확히 이 div 자체가 클릭된 경우만 toggle 실행
      if (e.target === e.currentTarget) {
        setIsOpen((prev) => !prev);
      }
    }}
    >
          <div className="flex justify-between items-center cursor-pointer"
             onClick={() => setIsOpen((prev) => !prev)}
          >
          <h4 className="font-bold">📅 클라이언트 관리</h4>
          <span className="text-xl">{isOpen ? "▲" : "▼"}</span>
        </div>
      {/* 접히는 본문 */}
      {isOpen && (
        <>
         <table className="text-xs min-w-full text-center bg-white rounded-lg overflow-hidden border border-gray-200 cursor-default">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-5 py-4 border-b border-gray-300">번호</th>
              <th className="px-5 py-4 border-b border-gray-300">역할</th>
              <th className="px-5 py-4 border-b border-gray-300">총판</th>
              <th className="px-5 py-4 border-b border-gray-300">대행</th>
              <th className="px-5 py-4 border-b border-gray-300">아이디</th>
              <th className="px-5 py-4 border-b border-gray-300">이름</th>
              <th className="px-5 py-4 border-b border-gray-300" style={{ display: currentUser?.role === 0  ? '' : 'none' }}>엑셀 허용</th>
              <th className="px-5 py-4 border-b border-gray-300" style={{ display: currentUser?.role === 0  ? '' : 'none' }}>순위조회 허용</th>
              <th className="px-5 py-4 border-b border-gray-300" >단가</th>
              <th className="px-5 py-4 border-b border-gray-300">슬롯 합계</th>
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
                <td className="border p-2" style={{ display: currentUser?.role === 0  ? '' : 'none' }}>
                  <label className="relative inline-block w-10 h-5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={excelLocalSwitchState[user.seq] || false}
                      onChange={(e) => {
                        setExcelLocalSwitchState((prev) => ({
                          ...prev,
                          [user.seq]: !prev[user.seq],
                        }));
                        handleChangeRole(user.seq, e.target.checked, "excelAllow");
                      }}
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#282828] transition-colors duration-200"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
                  </label>
                </td>

            

                <td className="border p-2" style={{ display: currentUser?.role === 0  ? '' : 'none' }} >
                  <label className="relative inline-block w-10 h-5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={rankingLocalSwitchState[user.seq] || false}
                      onChange={(e) => {
                        setRankingLocalSwitchState((prev) => ({
                          ...prev,
                          [user.seq]: !prev[user.seq],
                        }));
                        handleChangeRole(user.seq, e.target.checked, "rankingCheckAllow");
                      }}
                    />
                    <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#282828] transition-colors duration-200"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
                  </label>
                </td>
                <td className="border p-2">
                    <div>
                      {editRow === user.seq ? (
                        <>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={price}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*$/.test(value)) {
                                setPrice(Number(value));
                              }
                            }}
                            className="border rounded px-1 py-0.5 text-sm"
                          />
                          <button
                            style={{ display: (currentUser!.role === 0 || currentUser!.role === 1) ? '' : 'none' }}
                            onClick={() => {
                              handleSubmit(user.seq);
                              setEditRow(null);
                            }}
                            className="text-blue-500 underline text-sm ml-2"
                          >
                            확인
                          </button>
                          <button
                            style={{ display: (currentUser!.role === 0 || currentUser!.role === 1) ? '' : 'none' }}
                            onClick={() => setEditRow(null)}
                            className="text-blue-500 underline text-sm ml-2"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          {user.price}
                          <button
                            style={{ display: (currentUser!.role === 0 || currentUser!.role === 1) ? '' : 'none' }}
                            onClick={() => {
                              setPrice(user.price);
                              setEditRow(user.seq); // 현재 row만 edit 모드로 설정
                            }}
                            className="text-[#282828] underline text-sm ml-2"
                          >
                            수정
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                <td className="border p-2">{user.slotCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
           {/* 페이지네이션 UI */}
        <div className="mt-8 flex justify-center items-center gap-2 flex-wrap cursor-default">
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
        </>
      )}
    </div>
  );
}

