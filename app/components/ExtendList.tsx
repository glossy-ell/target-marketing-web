'use client';

import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

interface Extend {
  extendDay: number;
  seq: number;
  slotSeq: number;
  userId: string;
  agencyId: string;
  distributorId: string;
  productLink: string;
  keyword: string;
  startDate: string;
  endDate: string;
  productId: string | null;
  vendorId: string | null;
  thumbnail: string;
  rank: number;
  memo: string;
  sortation : number;
  secretKey1 : string;
  secretKey2 : string;
  secretKey3 : string;
  secretKey4 : string;
  secretLandingKey1 : string;
  secretLandingKey2 : string;
  secretLandingKey3 : string;
  secretLandingKey4 : string;
  status: boolean;
}


interface User {
  seq: number;
  role: number;
  id: string;
  name: string;
  agencyId: string | null;
  agencySeq: number | null;
  distributorId: string | null;
  distributorSeq: number | null;
  createdAt: string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

const ExtendList = () => {

  const [extendList,setExtendList] =  useState<Extend[]>([]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [rankingSlotSeq, setRankingSlotSeq] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number; excelAllow:number; additionalRegAllow:number;} | null>(null);

  const [time, setTime] = useState<{ open_start_time: string; open_end_time: string; edit_start_time: string; edit_end_time:string;} | null>(null);





  //모달 변수
  const [additionalModalOpen, setAdditionalModalOpen] = useState(false); //모달


  const [isKeyword, setIsKeyword] = useState<boolean>(false);
  const [keyword, setKeyword] = useState("");
  const [secretKey1, setSecretKey1] = useState("");
  const [secretKey2, setSecretKey2] = useState("");
  const [secretKey3, setSecretKey3] = useState("");
  const [secretKey4, setSecretKey4] = useState("");


  const [secretLandingKey1, setSecretLandingKey1] = useState("");
  const [secretLandingKey2, setSecretLandingKey2] = useState("");
  const [secretLandingKey3, setSecretLandingKey3] = useState("");
  const [secretLandingKey4, setSecretLandingKey4] = useState("");

  const [currentSort,setCurrentSort] = useState<number|null>(null);


  const [isInitialOpen, setIsInitialOpen] = useState(false);

  const [targetExtendList,setTargetExtendList] = useState<Extend[]>([]); //키워드

  const router = useRouter();


  const maxButtons = 10;
  const half = Math.floor(maxButtons / 2);
  let startPage = Math.max(1, page - half);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  const MySwal = withReactContent(Swal);



  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('로그인 정보 확인 실패');
        const user = await res.json();
        setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role),excelAllow: Number(user.excelAllow), additionalRegAllow:  Number(user.additionalRegAllow)});

        if (user.role != 0) {
          router.replace('slot-management');
        }

      } catch (err) {
        setError('로그인 정보가 없습니다.');
      }
    };

    fetchCurrentUser();
  }, []);


  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch('/api/config', { credentials: 'include' });
        if (!res.ok) throw new Error('로그인 정보 확인 실패');
        const result = await res.json();
        const timeObj = result.reduce((acc:any, cur:any) => {
          acc[cur.key] = cur.value;
          return acc;
        }, {} as Record<string, string>);
        setTime({
          open_start_time: timeObj.open_start_time,
          open_end_time: timeObj.open_end_time,
          edit_start_time: timeObj.edit_start_time,
          edit_end_time: timeObj.edit_end_time,
        });
      } catch (err) {
        setError('시간 정보 호출에 실패했습니다.');
      }
    };

    fetchTime();
  }, []);



  const isAdmin = currentUser?.role === 0;
  const isDistributor = currentUser?.role === 1;

  const fetchExtends = async () => {

    setLoading(true);
    setError(null);


    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: itemsPerPage.toString(),
      });


      const response = await fetch(`/api/extend?${params}`);

      if (response.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');

      const json = await response.json();

      const { data, totalPages } = json;
      if (!Array.isArray(data)) throw new Error('잘못된 데이터 형식입니다.');

      setExtendList(data);
      setTotalPages(totalPages);  // 여기서 바로 totalPages 세팅
    } catch (err: unknown) {
      console.error('fetchSlots error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setExtendList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if(!currentUser || currentUser.role != 0)
      return;

    fetchExtends();
  }, [search, page, itemsPerPage,currentUser]);



  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (trimmed !== search) {
      setPage(1);
      setSearch(trimmed);
    } else {
      // 같은 값이라도 강제로 fetch 재호출하고 싶으면:
      fetchExtends();
    }
  };


  // const handleSelectAll = () => {
  //   if (selectAll) {
  //     setSelectedIds([]);
  //   } else {
  //     setSelectedIds(slots.map((slot) => slot.seq));
  //   }
  //   setSelectAll(!selectAll);
  // };
   const handleSelectAll = () => {
    const currentPageIds = extendList.map((extend) => extend.seq);
    if (selectAll) {
        setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        setTargetExtendList((prev) =>
            prev.filter((extend) => !currentPageIds.includes(extend.seq))
        );
    } else {
        setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
        setTargetExtendList((prev) => {
            const newExtendList = extendList.filter((extend) => !prev.some((p) => p.seq === extend.seq));
            return [...prev, ...newExtendList];
        });
    }
    setSelectAll(!selectAll);
  };

  // const handleCheckboxChange = (id: number) => {
  //   if (selectedIds.includes(id)) {
  //     setSelectedIds(selectedIds.filter((sid) => sid !== id));
  //   } else {
  //     setSelectedIds([...selectedIds, id]);
  //   }
  // };

  const handleCheckboxChange = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(sid => sid !== id));
            setTargetExtendList(prevExtendList => prevExtendList.filter(extend => extend.seq !== id));
        } else {
            const addedExtend = extendList.find(extend => extend.seq === id);
            setSelectedIds(prev => [...prev, id]);
            if (addedExtend) {
                setTargetExtendList(prevExtendList => {
                    // 중복 체크 후 추가
                    if (prevExtendList.some(extend => extend.seq === id)) {
                        return prevExtendList;
                    }
                    return [...prevExtendList, addedExtend];
                });
            }
        }
    };





  const confirming = useRef<number | null>(null); //로킹 변수

  const handleConfirm = async (seq: number) => {
    if (confirming.current === seq) return; // 이미 처리중이면 무시
    confirming.current = seq;
    console.log(confirming.current);
    try {
      // API 호출 - 예시
      const res = await fetch('/api/extend', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seqs: [seq]}),
      });

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok) {
        throw new Error('연장 실패');
      }

      await MySwal.fire({
        icon: 'success',
        title: '연장되었습니다.',
        color: '#000',
        confirmButtonColor: '#282828',
      });

      // 저장 성공 시 처리
      setEditIndex(null);  // 편집 모드 종료
      setSelectedIds(selectedIds.filter((id) => id !== seq));
      await fetchExtends();  // 최신 데이터 다시 불러오기
    } catch (err) {
      console.error(err);
      alert('연장 승인 중 오류가 발생했습니다.');
    }finally {
      confirming.current =null;
    }
  };


    const handleConfirmAll = async () => {
    if (confirming.current === -1) return; // 이미 처리중이면 무시
    confirming.current = -1;
    try {
      const result = await MySwal.fire({
        title: '정말 선택하신 항목을 연장 승인하시겠습니까?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '연장',
        cancelButtonText: '취소',
        color: '#000',
        confirmButtonColor: '#282828',
        cancelButtonColor: '#555',
      });

      if (result.isConfirmed) {
        // API 호출 - 예시
        const res = await fetch('/api/extend', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seqs: selectedIds}),
        });

        if (res.status === 401) {
          window.location.href = '/';
          return;
        }

        if (!res.ok) {
          throw new Error('연장 실패');
        }


        await MySwal.fire({
          icon: 'success',
          title: '연장되었습니다.',
          color: '#000',
          confirmButtonColor: '#282828',
        });

        // 저장 성공 시 처리
        setEditIndex(null);  // 편집 모드 종료
        setSelectedIds([]);
        setSelectAll(false);
        await fetchExtends();  // 최신 데이터 다시 불러오기
      }
    } catch (err) {
      console.error(err);
      alert('연장 승인 중 오류가 발생했습니다.');
    }finally {
      confirming.current =null;
    }
  };


  const handleExtendDeny = async (seq: number) => {
    if (confirming.current === seq) return; // 이미 처리중이면 무시
    confirming.current = seq;

    const result = await MySwal.fire({
      title: '거절하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '거절',
      cancelButtonText: '취소',
      color: '#000',
      confirmButtonColor: '#282828',
      cancelButtonColor: '#555',
    });


    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/extend/deny', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq: seq }),
      });

      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok) throw new Error('연장 거절 실패');

      // 삭제 후 현재 페이지 상태 유지하면서 데이터 다시 불러오기
      await fetchExtends();

      // 선택 목록에서 제거
      setSelectedIds(selectedIds.filter((id) => id !== seq));
      await MySwal.fire({
        icon: 'success',
        title: '연장 요청이 거절되었습니다.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
    } catch (error) {
      console.error(error);
      await MySwal.fire({
        icon: 'error',
        title: '연장거절 중 오류가 발생했습니다.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
    }finally {
      confirming.current =null;
    }

  };


  const handleExtendDenyAll = async () => {
    if (confirming.current === -1) return; // 이미 처리중이면 무시
    confirming.current = -1;

    try{
      if (selectedIds.length === 0) {
        await MySwal.fire({
          icon: 'warning',
          title: '연장 거절할 슬롯을 선택하세요.',
          color: '#000',
          confirmButtonColor: '#282828',
        });
        return;
      }

      const result = await MySwal.fire({
        title: '선택하신 항목을 연장 거절하시겠습니까?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '연장',
        cancelButtonText: '취소',
        color: '#000',
        confirmButtonColor: '#282828',
        cancelButtonColor: '#555',
      });

      if (result.isConfirmed) {
        // 거절 API 요청
        await fetch('/api/extend/deny', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seqs: selectedIds }),
        });
        // 리스트 갱신
        setExtendList(extendList.filter((extend) => !selectedIds.includes(extend.seq)));
        setSelectedIds([]);
        setSelectAll(false);
        await fetchExtends();

        await MySwal.fire({
          icon: 'success',
          title: '연장 요청이 거절되었습니다.',
          color: '#000',
          confirmButtonColor: '#282828',
        });
      }
    }catch (error) {
      console.error(error);
      await MySwal.fire({
        icon: 'error',
        title: '연장거절 중 오류가 발생했습니다.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
    }finally {
      confirming.current =null;
    }

  };



  useEffect(()=>{
    setSelectAll(false)
  },[page])










  return (
    <div className="px-8 py-6 bg-white text-black min-h-screen rounded-lg shadow-lg">
      <div className="mb-3 flex items-center gap-2 justify-between w-full">
        {/* 왼쪽: 검색창 */}
        <div className="flex items-center gap-2 w-[450px]">
          <input
            type="text"
            placeholder="아이디, 키워드, 상품명, 프로덕트, 벤더"
            className="bg-white text-black border text-xs border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#282828] w-full"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />

        </div>

        {/* 오른쪽: select + 버튼들 */}
        <div className="flex items-center gap-2">
          <select
            className="border px-3 py-2 rounded-md text-xs"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}개씩
              </option>
            ))}
          </select>

          <button
            className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm"
            onClick={handleExtendDenyAll}
          >
            거절
          </button>
          <button
            className="bg-[#282828] hover:bg-[#141414] text-white px-3 py-2 rounded text-sm"
            onClick={handleConfirmAll}
          >
            승인
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-lg animate-pulse text-gray-500">
          🔄 요청 정보를 불러오는 중...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 font-semibold">
          ⚠ 오류: {error}
        </div>
      ) : (
        <>
          {extendList.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-lg font-light">
              🔍 연장 요청이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="text-xs min-w-full text-center bg-white rounded-lg overflow-hidden border border-gray-200">
                <thead className="text-xs bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-5 py-4 border-b border-gray-300">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>

                    <th className="px-5 py-4 border-b border-gray-300">번호</th>
                    <th className="px-5 py-4 border-b border-gray-300">슬롯번호</th>
                    {isAdmin && (
                      <th className="px-5 py-4 border-b border-gray-300">총판 ID</th>
                    )}

                    {(isAdmin || isDistributor) && (
                      <th className="px-5 py-4 border-b border-gray-300">대행사 ID</th>
                    )}
                    {/* <th className="px-5 py-4 border-b border-gray-300">구분</th>
                    <th className="px-5 py-4 border-b border-gray-300">상태</th>
                    <th className="px-5 py-4 border-b border-gray-300">추가등록</th> */}

                    <th className="px-5 py-4 border-b border-gray-300">사용자 ID</th>
                    <th className="px-5 py-4 border-b border-gray-300">썸네일</th>
                    <th className="px-5 py-4 border-b border-gray-300">키워드</th>
                    <th className="px-5 py-4 border-b border-gray-300">원부 링크</th>
                    <th className="px-5 py-4 border-b border-gray-300">시작일</th>
                    <th className="px-5 py-4 border-b border-gray-300">종료일</th>
                    <th className="px-5 py-4 border-b border-gray-300">연장요청일</th>
                    <th className="px-5 py-4 border-b border-gray-300">메모</th>
                    <th className="px-5 py-4 border-b border-gray-300">액션</th>
                  </tr>
                </thead>

                <tbody>
                  {extendList.map((extend, index) => {
                    const isEditing = editIndex === index;
                    return (
                      <tr
                        key={extend.seq}
                        className="hover:bg-gray-100 transition-colors duration-200"
                      >
                        <td className="p-3 border-b border-gray-200">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(extend.seq)}
                            onChange={() => handleCheckboxChange(extend.seq)}
                          />
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {extend.seq}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {extend.slotSeq}
                        </td>
                        {isAdmin && (
                          <>
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                              {extend.distributorId || '-'}
                            </td>
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                              {extend.agencyId || '-'}
                            </td>
                          </>
                        )}
                        {isDistributor && !isAdmin && (
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {extend.distributorId || '-'}
                          </td>
                        )}

                        {/* {isEditing ? (
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                              <select name=""
                                value={editedSlot.sortation || ''}
                               onChange={(e) =>
                                handleSortationChange('sortation', e.target.value)
                              }
                              id="sortation"
                              >
                                <option value="0">구분 선택</option>
                                <option value="1">키워드</option>
                                <option value="2">랜딩</option>
                              </select>
                            </td>
                          ) : (
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                              <span className="whitespace-nowrap">
                                {slot.sortation === 1
                                  ? "키워드"
                                  : slot.sortation === 2
                                  ? "랜딩"
                                  : "-"}
                              </span>
                            </td>
                          )} */}

                        {/* <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                slot.status ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></div>
                            <span className={slot.status ? 'text-green-600' : 'text-red-600'}>
                              {slot.status ? '정상' : '오류'}
                            </span>
                          </div>
                       </td> */}
                        {/* <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                          <Button
                              style={{
                                display: isEditing
                                  ? 'none'
                                  : currentUser && currentUser.additionalRegAllow === 1
                                  ? ''
                                  : 'none'
                              }}
                              className="bg-[#282828] hover:bg-[#141414] text-white px-3 py-1 rounded-md"
                              onClick={() => {
                                setSelectedModalSlot(slot);
                                setAdditionalModalOpen(true);
                              }
                              }>
                              추가등록
                          </Button>
                        </td> */}

                        <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                          {extend.userId}
                        </td>
                        <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                          {extend.thumbnail ? (
                            <img
                              src={extend.thumbnail}
                              alt="썸네일"
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 border-b border-gray-200 max-w-[120px]">
                          <>
                            <div className="flex flex-col">
                              <span className="whitespace-nowrap">
                                {extend.keyword || '-'}
                              </span>
                              {typeof extend.rank === 'number' && (
                                <span
                                  className="text-blue-500 cursor-pointer hover:underline whitespace-nowrap"
                                  onClick={() => setRankingSlotSeq(extend.slotSeq)}
                                >
                                  (순위: {
                                    extend.rank === -1
                                      ? '오류 발생'
                                      : extend.rank === 0
                                        ? '순위권 밖'
                                        : `${extend.rank}위`
                                  })
                                </span>
                              )}
                            </div>
                          </>
                        </td>
                        <Tooltip.Provider delayDuration={100}>
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {extend.productLink ? (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <a
                                    href={extend.productLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-700 hover:underline truncate inline-block max-w-[200px] cursor-pointer"
                                  >
                                    {extend.productLink}
                                  </a>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px]"
                                    sideOffset={5}
                                  >
                                    {extend.productLink}
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </Tooltip.Provider>



                        <td className="p-3 border-b border-gray-200">
                          {formatDate(extend.startDate)}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {formatDate(extend.endDate)}
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {extend.extendDay}
                        </td>
                        <Tooltip.Provider delayDuration={100}>
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {extend.memo ? (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <span className="block max-w-[150px] truncate text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer mx-auto">
                                    {extend.memo}
                                  </span>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[200px]"
                                    sideOffset={5}
                                  >
                                    {extend.memo}
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </Tooltip.Provider>
                        <td className="p-3 border-b border-gray-200 space-x-2 whitespace-nowrap">
                            <>
                              <Button
                                className="bg-[#282828] hover:bg-[#141414] text-white px-3 py-1 rounded-md"
                                onClick={() => handleConfirm(extend.seq)}
                              >
                                승인
                              </Button>
                              <Button
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md"
                                onClick={() => handleExtendDeny(extend.seq)}
                              >
                                거절
                              </Button>
                            </>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>

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
};

export default ExtendList;
