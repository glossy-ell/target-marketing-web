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

  const [selectedIds, setSelectedIds] = useState<number[]>([]); //키워드
  const [selectedLandingIds, setSelectedLandingIds] = useState<number[]>([]); // 랜딩
  const [selectAll, setSelectAll] = useState(false);
  const [selectLandingAll, setSelectLandingAll] = useState(false);

  const [rankingSlotSeq, setRankingSlotSeq] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number } | null>(null);

  const [duration, setDuration] = useState<string>("1");

  const [targetSlot,setTargetSlot] = useState<Slot[]>([]); //키워드
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
            return;
        }
        setCurrentUser(user);
      } catch (err) {
        console.error(err);
        alert("로그인 정보를 확인하세요.");
        window.close();
      }
    };

    fetchCurrentUser();
  }, []);


  const fetchSlots = async () => {
    setLoading(true);
    try {
      let url = `/api/slots/all`;


      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('슬롯 목록 조회 실패');
      const data = await res.json();
      const selectedSlots = data.data;
      setSlots(selectedSlots);
    } catch (err) {
      console.error(err);
      setError('슬롯을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchSlots();
    fetchUsers();
  }, [page, itemsPerPage, search]);


  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) throw new Error('유저 목록 조회 실패');
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
      alert('유저 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    // 부모에게 준비 완료 신호
    window.opener?.postMessage('popup-ready', window.location.origin);
  }, []);

  useEffect(() => {
  const handleMessage = async (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    
    const { targetSlot, selectedIds } = event.data;
    
    if (!targetSlot) {
      setLoading(false);
      return;
    }
    
    setSlots(targetSlot);
    setTargetSlot(targetSlot);
    setSelectedIds(selectedIds || []);
    setLoading(false);
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
          { wch: 60 },   // 상품링크
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



  const isAdmin = currentUser?.role === 0;
  const isDistributor = currentUser?.role === 1;

  return (
    <div className="px-8 py-6 bg-white text-black min-h-screen rounded-lg shadow-lg">
      <div className="mb-3 flex items-center gap-2 justify-between w-full">
        {/* 왼쪽: 검색창 */}
        <div className="flex items-center gap-2 w-[550px]">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm whitespace-nowrap"
            onClick={()=>{
              excelDownload()
            }}>
            엑셀 다운로드
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">시작일:</label>
          <ReactDatePicker
            selected={startDate ? new Date(startDate) : null}
            onChange={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                setStartDate(`${year}-${month}-${day}`);
              } else {
                setStartDate('');
              }
            }}
            dateFormat="yyyy-MM-dd"
            locale={ko}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholderText="시작일 선택"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">종료일:</label>
          <ReactDatePicker
            selected={endDate ? new Date(endDate) : null}
            onChange={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                setEndDate(`${year}-${month}-${day}`);
              } else {
                setEndDate('');
              }
            }}
            dateFormat="yyyy-MM-dd"
            locale={ko}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholderText="종료일 선택"
          />
        </div>
      </div>

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
      />
    </div>
  );
};

export default SlotList;

