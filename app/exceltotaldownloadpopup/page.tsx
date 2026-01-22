'use client';

import SlotRankingModal from '@/components/modals/SlotRankingModal';
import SlotTable from '@/components/common/SlotTable';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ko } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import ReactDatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as XLSX from 'xlsx-js-style';


interface Slot {
  seq: number;
  mid: string | null;
  userId: string;
  agencyId: string;
  distributorId: string;
  keyword: string;
  startDate: string;
  endDate: string;
  rank: number;
  memo: string;
  singleLink: string;
  hasRanking: number;
  createdAt: string;
  errMsg: string;
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



const SlotList = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editedSlot, setEditedSlot] = useState<Partial<Slot>>({});

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
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number } | null>(null);

  const [time,setTime] = useState<number>(1);
  const [duration, setDuration] = useState<string>("1");

  const [targetSlot,setTargetSlot] = useState<Slot[]>([]);

  const [menu,setMenu] = useState<number>(0);


  const onceRef = useRef(false);
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
        if (user.role !=0 && user.role !=1) {
            alert("권한이 없습니다.");
            window.close();
            window.location.href = "/slot-management";
            setError('로그인 정보가 없습니다.');
        }
        setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role) });
      } catch (err) {
        setError('로그인 정보가 없습니다.');
      }
    };

    fetchCurrentUser();
  }, []);



  useEffect(()=>{
    setSelectAll(false)
  },[page])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('로그인 정보 확인 실패');
        const user = await res.json();
        setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role) });
      } catch (err) {
        setError('로그인 정보가 없습니다.');
      }
    };

    fetchCurrentUser();
  }, []);

  const isAdmin = currentUser?.role === 0;
  const isDistributor = currentUser?.role === 1;

  useEffect(() => {
    if (onceRef.current) return;
    onceRef.current = true;
    
    // sessionStorage에서 데이터 복원 시도
    try {
      const savedData = sessionStorage.getItem('excelTotalDownloadData');
      if (savedData) {
        const { targetSlot, selectedIds } = JSON.parse(savedData);
        if (targetSlot && targetSlot.length > 0) {
          setSlots(targetSlot);
          setTargetSlot(targetSlot);
          setSelectedIds(selectedIds || []);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('sessionStorage 복원 실패:', err);
    }
    
    window.opener?.postMessage('popup-ready', window.origin);
  const handleMessage = (event: MessageEvent) => {

    if (event.origin !== window.location.origin) return;
    const { targetSlot,selectedIds } = event.data;

    const filteredSlots = targetSlot;
    if(!filteredSlots){
      setLoading(false);
      return;
    }

    setSlots(filteredSlots);

    const targetSlots = filteredSlots.sort((a:Slot, b:Slot) => b.seq - a.seq); // 역순
    const selectedKeywordIds = targetSlots.map((slot:Slot)=> slot.seq);

    setTargetSlot(targetSlots);
    setSelectedIds(selectedKeywordIds);

    setLoading(false);
    
    // sessionStorage에 데이터 저장
    try {
      sessionStorage.setItem('excelTotalDownloadData', JSON.stringify({ targetSlot: targetSlots, selectedIds: selectedKeywordIds }));
    } catch (err) {
      console.error('sessionStorage 저장 실패:', err);
    }
  };

  window.addEventListener('message', handleMessage);

  return () => {
    window.removeEventListener('message', handleMessage);
  };
}, []);






  const handleInputChange = (field: keyof Slot, value: string) => {
    const updatedSlot = { ...editedSlot, [field]: value };
    setEditedSlot(updatedSlot);
  };



    const headerMapKeyword: Record<string, string> = {
      "타입": "타입",
      "상품 링크": "상품 링크",
      "시작 날짜": "시작 날짜",
      "종료 날짜": "종료 날짜",
      "검색어": "검색어",
      "MID": "MID",
    };


    const convertSlotsToExcelData = (slots: Slot[], customMode: number = 0) => {
        const result: any[] = [];


       slots.forEach((slot) => {
        // const startDate = new Date( Math.min(new Date(slot.endDate).getTime() ,new Date().setHours(0, 0, 0, 0) +86400000));   // 하루 더하기

          const slotStartDate =  new Date(
                                Math.max(
                                  Math.min(
                                    new Date(slot.endDate).getTime(),
                                    isNaN(new Date(startDate).getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000).getTime() : new Date(startDate).getTime()
                                  ),
                                  new Date(slot.startDate).getTime()
                                )
                              )


        const maxEndDate = new Date(slot.endDate);

        // startDate + duration일
        // const calculatedEndDate = new Date(startDate.getTime() + ((Number(duration) - 1) * 86400000) ); // 하루 더하기

        // 만약 계산된 endDate가 slot.endDate를 넘으면 slot.endDate로 제한
        // const slotEndDate = calculatedEndDate > maxEndDate ? maxEndDate : calculatedEndDate;

        const slotEndDate =   new Date(
                                Math.min(
                                  new Date(slot.endDate).getTime(),
                                  isNaN(new Date(endDate).getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000).getTime() : new Date(endDate).getTime()
                                )
                              )
        const baseRow = {
          '타입': '리워드',
          '상품 링크': slot.singleLink ?? '',
          '시작 날짜': slotStartDate,
          '종료 날짜': slotEndDate,
          '검색어': slot.keyword ?? '',
          'MID': slot.mid ?? '',
        };
        result.push(baseRow);
      });
        return result;
    };

    const formatDate = (dateStr: string | Date) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };



    const excelDownload= () => {
        if(Number(duration) ==0){
          alert("날짜를 입력해주세요");
          return;
        }

        if (targetSlot.length === 0) {
          alert("다운로드할 슬롯이 없습니다.");
          return;
        }

        // 엑셀 다운로드
        const keywordData = convertSlotsToExcelData(targetSlot);
        const keywordHeaders = Object.entries(headerMapKeyword);

        const keywordSheetData = [
          keywordHeaders.map(([_, desc]) => desc),
          ...keywordData.map(row => keywordHeaders.map(([key]) => row[key] ?? ''))
        ];

        const keywordWorkSheet = XLSX.utils.aoa_to_sheet(keywordSheetData);

        keywordHeaders.forEach((_, colIdx) => {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
          const cell = keywordWorkSheet[cellAddress];
          if (cell) {
            cell.s = {
              alignment: {
                wrapText: true,
                vertical: "top"
              },
              font: {
                name: "맑은 고딕",
                sz: 11
              }
            };
          }
        });

        keywordData.forEach((_, rowIdx) => {
          keywordHeaders.forEach((_, colIdx) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
            const cell = keywordWorkSheet[cellAddress];
            if (cell) {
              cell.s = {
                alignment: {
                  horizontal: "left",
                  vertical: "top",
                  wrapText: true
                },
                font: {
                  name: "맑은 고딕",
                  sz: 11
                }
              };
            }
          });
        });

        keywordWorkSheet['!cols'] = [
          { wch: 60 },   // 랜딩URL
          { wch: 60 },   // 시작일
          { wch: 60 },   // 종료일
          { wch: 60 },   // 검색어
          { wch: 60 },   // MID
        ];

        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const keywordWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(keywordWorkbook, keywordWorkSheet, 'my_sheet');
        XLSX.writeFile(keywordWorkbook, `타겟 마케팅 -${dateStr}.xlsx`);
    };


    useEffect(() => {
      setInputValue(String(time));
    }, [time]);


  return (
    <div className="px-8 py-6 bg-white text-black min-h-screen rounded-lg shadow-lg">
      <div className="mb-3 flex items-center gap-2 justify-between w-full">
        {/* 왼쪽: 검색창 */}
        <div className="flex items-center gap-2 w-[550px]">
          <button
            className="bg-[#282828] text-white px-4 py-2 rounded hover:bg-[#141414] text-sm whitespace-nowrap"
            onClick={excelDownload}
          >
            엑셀 다운로드
          </button>
          {/* <input
              type="number"
              min={1}
              placeholder="기간(일)"
              className="border border-gray-300 rounded px-2 py-1 w-[80px] text-sm"
              value={duration}
               onChange={(e) => {
                let val = e.target.value;

                // 숫자 또는 빈 문자열만 허용
                if (/^\d*$/.test(val)) {
                  if (val === '') {
                    setDuration('0');
                  }
                  // 입력값이 0으로 시작하면 제거
                  else if (val.length > 1 && val.startsWith('0')) {
                    // 예: "01" → "1"
                    setDuration(val.replace(/^0+/, ''));
                  }
                  else if (Number(val) > 0 && Number(val) <= 10) {
                    setDuration(val);
                  }
                }
              }}

          /> */}
          <ReactDatePicker
            selected={startDate ? new Date(startDate.split(' ')[0]) : null}
            onChange={(date: Date | null) => {
              if (date) {
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} 00:00:00.000`;
                setStartDate(formattedDate);
              }
            }}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            locale={ko}
            placeholderText="시작일 선택"
          />
          <ReactDatePicker
            selected={endDate ? new Date(endDate.split(' ')[0]) : null}
            onChange={(date: Date | null) => {
              if (date) {
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} 00:00:00.000`;
                setEndDate(formattedDate);
              }
            }}
            dateFormat="yyyy-MM-dd"
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            locale={ko}
            placeholderText="종료일 선택"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-lg animate-pulse text-gray-500">
          🔄 슬롯 정보를 불러오는 중...
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 font-semibold">
          ⚠ 오류: {error}
        </div>
      ) : (
        <>
          {slots.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-lg font-light">
              🔍 조건에 맞는 슬롯이 없습니다.
            </div>
          ) : (
            <SlotTable
              slots={slots}
              isAdmin={isAdmin}
              isDistributor={isDistributor}
              selectedIds={selectedIds}
              selectAll={false}
              handleSelectAll={() => {}}
              handleCheckboxChange={() => {}}
              formatDate={formatDate}
              showActions={false}
              showCheckbox={false}
              showActionColumn={false}
              dateRangeStart={startDate}
              dateRangeEnd={endDate}
            />
          )}

          {rankingSlotSeq !== null && (
            <SlotRankingModal
              slotSeq={rankingSlotSeq}
              onClose={() => setRankingSlotSeq(null)}
            />
          )}

          {/* <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
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
          </div> */}
        </>
      )}
    </div>
  );
};

export default SlotList;

