'use client';

import SlotRankingModal from '@/components/modals/SlotRankingModal';
import SlotTable from '@/components/common/SlotTable';
import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import ReactDatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import { addMonths, set } from "date-fns";
import { ko } from 'date-fns/locale';
import { start } from 'repl';

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
  comparePriceLink: string | null;
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
  rankingCheckAllow: boolean;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

interface SlotListProps {
  slotSearchType: number;
  setSlotSearchType: Dispatch<SetStateAction<number>>;
}


const SlotList = (   {
  slotSearchType,
  setSlotSearchType,
  }: SlotListProps) => {
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

  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number; excelAllow:number; slotAllow:number; userAllow: number; rankingCheckAllow:number; }  | null>(null);
  const [showExcelUploadPopup, setShowExcelUploadPopup] = useState(false);

  const [time, setTime] = useState<{ open_start_time: string; open_end_time: string; edit_start_time: string; edit_end_time:string;} | null>(null);

  const [newSlot, setNewSlot] = useState<Partial<Slot>>({
    keyword: '',
    startDate: '',
    endDate: '',
  });


  const [targetSlot,setTargetSlot] = useState<Slot[]>([]); //키워드
  

  const [rankOption, setRankOption] = useState<-1 | 0 | 1>(0);
  const [weekendOpen,setWeekendOpen] = useState<boolean>(false);


  //시작일 필터
  const [startSearchStartDate, setStartSearchStartDate] = useState<Date | null>(null);
  const [selectedDate1, setSelectedDate1] = useState<Date | null>(null);

  const [startSearchendDate, setStartSearchEndDate] = useState<Date | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<Date | null>(null);


  //종료일 필터
  const [endSearchStartDate, setEndSearchStartDate] = useState<Date | null>(null);
  const [selectedDate3, setSelectedDate3] = useState<Date | null>(null);

  const [endSearchEndDate, setEndSearchEndDate] = useState<Date | null>(null);
  const [selectedDate4, setSelectedDate4] = useState<Date | null>(null);



  const maxButtons = 10;
  const half = Math.floor(maxButtons / 2);
  let startPage = Math.max(1, page - half);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }
  const MySwal = withReactContent(Swal);

  function openRankingModal(seq: number) {
    setRankingSlotSeq(seq);
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('로그인 정보 확인 실패');
        const user = await res.json();
        setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role),excelAllow: Number(user.excelAllow), slotAllow: Number(user.slotAllow), userAllow:Number(user.userAllow), rankingCheckAllow:Number(user.rankingCheckAllow)});
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

        fetch('/api/weekend')
          .then(res => res.json())
          .then(data => {
            setWeekendOpen(Boolean(data[0].allow));
          })
          .catch(err => console.error('config fetch error:', err));


      } catch (err) {
        setError('시간 정보 호출에 실패했습니다.');
      }
    };

    fetchTime();
  }, []);



  const isAdmin = currentUser?.role === 0;
  const isDistributor = currentUser?.role === 1;

  const fetchSlots = async () => {

    setLoading(true);
    setError(null);
  
  
    try {
      const params = new URLSearchParams();
      params.set('search', search);
      params.set('rankOption', rankOption.toString());
      params.set('page', page.toString());
      params.set('pageSize', itemsPerPage.toString());
      params.set('slotSearchType', slotSearchType.toString());

      const toDBDateString = (d: Date | null, endOfDay = false) => {
        if (!d) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day} ${endOfDay ? '23:59:59.999' : '00:00:00.000'}`;
      };

      const sss = toDBDateString(startSearchStartDate, false);
      const sse = toDBDateString(startSearchendDate, true);
      const ess = toDBDateString(endSearchStartDate, false);
      const ese = toDBDateString(endSearchEndDate, true);

      if (sss) params.set('startSearchStartDate', sss);
      if (sse) params.set('startSearchEndDate', sse);
      if (ess) params.set('endSearchStartDate', ess);
      if (ese) params.set('endSearchEndDate', ese);



      const response = await fetch(`/api/slots?${params}`);

      if (response.status === 401) {
        window.location.href = '/';
        return; // 이후 코드 실행 막기 위해 return
      }

      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');

      const json = await response.json();


      const { data, totalPages } = json;
      if (!Array.isArray(data)) throw new Error('잘못된 데이터 형식입니다.');

      setSlots(data);
      setTotalPages(totalPages);  // 여기서 바로 totalPages 세팅
    } catch (err: unknown) {
      console.error('fetchSlots error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };
  const [searchStart,setSearchStart] = useState<boolean>(false);

  useEffect(() => {
      setPage(1);
      setSearchStart(!searchStart);
    }, [slotSearchType]);

  useEffect(() => {
    fetchSlots();
  }, [search, page, itemsPerPage,searchStart,startSearchStartDate,startSearchendDate,endSearchStartDate,endSearchEndDate,slotSearchType,rankOption]);



  const handleEditClick = (index: number) => {
    const now = new Date();
    const nowTime = now.toTimeString().slice(0,8);
    const day = now.getDay(); // 0: 일요일, 6: 토요일


    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    // 관리자가 아닌 경우에만 시간 체크
    if(currentUser?.role !== 0) {
      if(nowTime< editStartTime || nowTime>editEndTime){
        alert(`현시각에는 수정이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
        return;
      }
    }


    const isWeekend = (day === 0 || day === 6);

    if(!weekendOpen ){
      alert(`수정작업이 제한되어있습니다.`);
      return;
    }


    setEditIndex(index);
    setEditedSlot({ ...slots[index] });
  };

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (trimmed !== search) {
      setPage(1);
      setSearch(trimmed);
    } else {
      // 같은 값이라도 강제로 fetch 재호출하고 싶으면:
      fetchSlots();
    }
  };

  useEffect(()=>{
      handleSearch();
  },[rankOption]) // 옵션 변경시


  // const handleSelectAll = () => {
  //   if (selectAll) {
  //     setSelectedIds([]);
  //   } else {
  //     setSelectedIds(slots.map((slot) => slot.seq));
  //   }
  //   setSelectAll(!selectAll);
  // };
   const handleSelectAll = () => {
    const currentPageIds = slots.map((slot) => slot.seq);
    if (selectAll) {
        setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
        setTargetSlot((prev) =>
            prev.filter((slot) => !currentPageIds.includes(slot.seq))
        );
    } else {
        setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
        setTargetSlot((prev) => {
            const newSlots = slots.filter((slot) => !prev.some((p) => p.seq === slot.seq));
            return [...prev, ...newSlots];
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
            setTargetSlot(prevSlots => prevSlots.filter(slot => slot.seq !== id));
        } else {
            const addedSlot = slots.find(slot => slot.seq === id);
            setSelectedIds(prev => [...prev, id]);
            if (addedSlot) {
                setTargetSlot(prevSlots => {
                    // 중복 체크 후 추가
                    if (prevSlots.some(slot => slot.seq === id)) {
                        return prevSlots;
                    }
                    return [...prevSlots, addedSlot];
                });
            }
        }
    };

  const handleInputChange = (field: keyof Slot, value: string) => {
    const updatedSlot = { ...editedSlot, [field]: value };
    setEditedSlot(updatedSlot);
  };


  const handleConfirm = async (seq: number) => {
    try {
      // editedSlot에는 현재 편집 중인 슬롯 데이터가 있다고 가정
      const updateData = { ...editedSlot };

      // 공백 제거
      if (updateData.singleLink) {
        updateData.singleLink = updateData.singleLink.trim();
      }

      // API 호출 - 예시
      const res = await fetch('/api/slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seqs: [seq], ...updateData }),
      });
      if (res.status === 401) {
        window.location.href = '/';
        return;
      }

      if (!res.ok) {
        if(res.status===400){
          alert('수정된 항목이 없습니다');
          return;
        }
        throw new Error('저장 실패');
      }

      // 저장 성공 시 처리
      setEditIndex(null);  // 편집 모드 종료
      await fetchSlots();  // 최신 데이터 다시 불러오기
      handleCheckboxChange(seq)
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };


  const handleCancel = () => {
    setEditIndex(null);
    setEditedSlot({});
  };

  const handleSingleDelete = async (seq: number) => {
    const now = new Date();
    const nowTime = now.toTimeString().slice(0,8);

    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    // 관리자가 아닌 경우에만 시간 체크
    if(currentUser?.role !== 0) {
      if(nowTime< editStartTime || nowTime>editEndTime){
        alert(`현시각에는 삭제가 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
        return;
      }
    }


    const result = await MySwal.fire({
      title: '정말 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      color: '#000',
      confirmButtonColor: '#282828',
      cancelButtonColor: '#555',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch('/api/slots/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seq: seq }),
      });

      if (res.status === 401) {
        window.location.href = '/';
        return; // 이후 코드 실행 막기 위해 return
      }

      if (!res.ok) throw new Error('삭제 실패');

      // 삭제 후 현재 페이지 상태 유지하면서 데이터 다시 불러오기
      await fetchSlots();

      // 선택 목록에서 제거
      setSelectedIds(selectedIds.filter((id) => id !== seq));

      await MySwal.fire({
        icon: 'success',
        title: '선택된 슬롯이 삭제되었습니다.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
    } catch (error) {
      console.error(error);
      await MySwal.fire({
        icon: 'error',
        title: '삭제 중 오류가 발생했습니다.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
    }
  };

  const handleDelete = async () => {

    const now = new Date();
    const nowTime = now.toTimeString().slice(0,8);

    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    // 관리자가 아닌 경우에만 시간 체크
    if(currentUser?.role !== 0) {
      if(nowTime< editStartTime || nowTime>editEndTime){
        alert(`현시각에는 삭제가 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
        return;
      }
    }
    if (selectedIds.length === 0) {
      await MySwal.fire({
        icon: 'warning',
        title: '삭제할 슬롯을 선택하세요.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
      return;
    }

    const result = await MySwal.fire({
      title: '정말 삭제하시겠습니까?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      color: '#000',
      confirmButtonColor: '#282828',
      cancelButtonColor: '#555',
    });

    if (result.isConfirmed) {
      // 삭제 API 요청
      const res = await fetch('/api/slots/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seqs: selectedIds }),
      });
       if (res.status === 401) {
        window.location.href = '/';
        return; // 이후 코드 실행 막기 위해 return
      }

      // 리스트 갱신
      setSlots(slots.filter((slot) => !selectedIds.includes(slot.seq)));
      setSelectedIds([]);
      setTargetSlot([]);
      setSelectAll(false);
      await fetchSlots();

      await MySwal.fire({
        icon: 'success',
        title: '선택된 슬롯이 삭제되었습니다.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
    }
  };

  const updateSlots = async (
    ids: number[],
    changes: { singleLink?: string; keyword?: string; mid?: string; }
  ) => {
    const body = {
      seqs: ids,
      ...changes,
    };

    const response = await fetch('/api/slots', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
      if (response.status === 401) {
        window.location.href = '/';
        return;
      }

    if (!response.ok) {
      const err = await response.json();
      console.log(err);
      throw new Error(err.error || 'Failed to update slots');
    }
  };

  const handleEdit = async () => {

    const now = new Date();
    const nowTime = now.toTimeString().slice(0,8);
    const day = now.getDay(); // 0: 일요일, 6: 토요일

    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    // 관리자가 아닌 경우에만 시간 체크
    if(currentUser?.role !== 0) {
      if(nowTime< editStartTime || nowTime>editEndTime){
        alert(`현시각에는 수정이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
        return;
      }
    }

      const isWeekend = (day === 0 || day === 6);

    if(!weekendOpen){
      alert(`수정 작업이 제한되어있습니다.`);
      return;
    }

    if (selectedIds.length === 0) {
      await MySwal.fire({
        icon: 'warning',
        title: '수정할 슬롯을 선택하세요.',
        color: '#000',
        confirmButtonColor: '#282828',
      });
      return;
    }

    const { value: formValues } = await MySwal.fire({
      title: '수정할 정보를 입력하세요',
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="키워드">` +
        `<input id="swal-input2" class="swal2-input" placeholder="상품 링크">` +
        `<input id="swal-input3" class="swal2-input" placeholder="가격비교링크">` +
        `<input id="swal-input4" class="swal2-input" placeholder="MID">`,
      focusConfirm: false,
      didOpen: () => {
        const singleLinkInput = document.getElementById('swal-input2') as HTMLInputElement;
        const comparePriceLinkInput = document.getElementById('swal-input3') as HTMLInputElement;
        const midInput = document.getElementById('swal-input4') as HTMLInputElement;

        singleLinkInput.addEventListener('input', () => {
          const rawValue = singleLinkInput.value;
          const trimmedValue = rawValue.trim();
          singleLinkInput.value = trimmedValue;  // 입력란에도 공백 제거 반영
        });

        comparePriceLinkInput.addEventListener('input', () => {
          const rawValue = comparePriceLinkInput.value;
          const trimmedValue = rawValue.trim();
          comparePriceLinkInput.value = trimmedValue;
        });

        midInput.addEventListener('input', () => {
          const rawValue = midInput.value;
          const trimmedValue = rawValue.trim();
          midInput.value = trimmedValue;
        });

      },
      preConfirm: () => {
        const keyword = (document.getElementById('swal-input1') as HTMLInputElement).value.trim();
        const singleLink = (document.getElementById('swal-input2') as HTMLInputElement).value.trim();
        const comparePriceLink = (document.getElementById('swal-input3') as HTMLInputElement).value.trim();
        const mid = (document.getElementById('swal-input4') as HTMLInputElement).value.trim();

        if (!singleLink && !keyword && !comparePriceLink && !mid) {
          MySwal.showValidationMessage('최소 하나는 입력해야 합니다.');
          return null;
        }

        return {
          ...(singleLink && { singleLink }),
          ...(keyword && { keyword }),
          ...(comparePriceLink && { comparePriceLink }),
          ...(mid && { mid }),
        };
      },
      showCancelButton: true,
      confirmButtonText: '수정',
      cancelButtonText: '취소',
      confirmButtonColor: '#282828',
      cancelButtonColor: '#555',
    });


    if (!formValues) return;

    try {
      await updateSlots(selectedIds, formValues);

      await fetchSlots();
      setSelectedIds([]);
      setTargetSlot([]);
      setSelectAll(false);

      await MySwal.fire({
        icon: 'success',
        title: '수정 완료',
        text: `${selectedIds.length}개의 슬롯이 수정되었습니다.`,
        confirmButtonColor: '#282828',
      });
    } catch (err: any) {
      console.error('수정 실패:', err);
      await MySwal.fire({
        icon: 'error',
        title: '수정 실패',
        text: err ? err.message : '문제가 발생했습니다. 다시 시도해주세요.',
        confirmButtonColor: '#282828',
      });
    }
  };


  const handleExtend = async () => {
    const now = new Date();

    const nowTime = now.toTimeString().slice(0,8);

    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    // 관리자가 아닌 경우에만 시간 체크
    if(currentUser?.role !== 0) {
      if(nowTime< editStartTime || nowTime>editEndTime){
        alert(`현시각에는 연장이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
        return;
      }
    }

    if (selectedIds.length === 0) {
      MySwal.fire({
        icon: 'warning',
        title: '연장할 슬롯을 선택하세요.',
        color: '#000',              // 흰색 글자
        confirmButtonColor: '#282828', // 버튼 흰색
      });
      return;
    }

    const {isConfirmed, value: daysToExtend } = await MySwal.fire({
        title: '연장할 일수를 입력하세요',
        input: 'number',
        inputValue: 7,               // 기본값 7 설정
        inputAttributes: {
          min: '1',
          step: '1',
          autocapitalize: 'off',
          autocorrect: 'off',
          style: 'color: #000; background: #fff;'  // 입력창 글자 검정, 배경 흰색
        },
        inputLabel: '몇 일 연장하시겠습니까?',
        inputPlaceholder: '예: 30',
        showCancelButton: true,
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        color: '#000',                // 흰색 글자
        confirmButtonColor: '#282828',   // 버튼 흰색
        cancelButtonColor: '#555',    // 취소 버튼 약간 밝은 회색
        inputValidator: (value) => {
          if (!value || Number(value) <= 0) {
            return '1 이상의 숫자를 입력해주세요.';
          }
          return null;
        },
      });

      if (!isConfirmed) {
        return; // 사용자가 '취소' 눌렀으면 함수 종료
      }

      try {
        const res = await fetch('/api/slots/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seqs: selectedIds, extendDays: Number(daysToExtend) }),
        });

        if(res.status === 401) {
          window.location.href = '/';
          return;
        }
        if (res.status === 429) {
          alert("이미 연장 요청한 항목이 존재합니다.");
          return;
        }

        if (!res.ok) throw new Error('연장 실패');


        if (isAdmin) {
          MySwal.fire({
            icon: 'success',
            title: `선택된 슬롯이 ${daysToExtend}일 연장되었습니다.`,
            color: '#000',
            confirmButtonColor: '#282828',
          });
        } else {
          MySwal.fire({
            icon: 'success',
            title: `선택된 슬롯이 ${daysToExtend}일 연장 요청되었습니다.`,
            text: `관리자 승인 후 연장됩니다.`,
            color: '#000',
            confirmButtonColor: '#282828',
          });
        }

        await fetchSlots();
        setSelectedIds([]);
        setTargetSlot([]);
        setSelectAll(false);
      } catch (error) {
        console.error(error);
        MySwal.fire({
          icon: 'error',
          title: '연장 중 오류가 발생했습니다.',
          color: '#fff',
          confirmButtonColor: '#282828',
        });
      }
    };
    const handleSingleExtend = async (seq: number) => {
      const now = new Date();
      const nowTime = now.toTimeString().slice(0, 8);
      const editStartTime = time?.edit_start_time || "23:59:59";
      const editEndTime = time?.edit_end_time || "00:00:00";

      // 관리자가 아닌 경우에만 시간 체크
      if(currentUser?.role !== 0) {
        if (nowTime < editStartTime || nowTime > editEndTime) {
          alert(`현시각에는 연장이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
          return;
        }
      }
      const {isConfirmed, value: daysToExtend } = await MySwal.fire({
        title: '연장할 일수를 입력하세요',
        input: 'number',
        inputValue: 7,               // 기본값 7 설정
        inputAttributes: {
          min: '1',
          step: '1',
          autocapitalize: 'off',
          autocorrect: 'off',
          style: 'color: #000; background: #fff;'  // 입력창 글자 검정, 배경 흰색
        },
        inputLabel: '몇 일 연장하시겠습니까?',
        inputPlaceholder: '예: 30',
        showCancelButton: true,
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        color: '#000',                // 흰색 글자
        confirmButtonColor: '#282828',   // 버튼 흰색
        cancelButtonColor: '#555',    // 취소 버튼 약간 밝은 회색
        inputValidator: (value) => {
          if (!value || Number(value) <= 0) {
            return '1 이상의 숫자를 입력해주세요.';
          }
          return null;
        },
      });

      if (!isConfirmed) {
        return; // 사용자가 '취소' 눌렀으면 함수 종료
      }

      try {
        const res = await fetch('/api/slots/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seqs: [seq], extendDays: Number(daysToExtend) }),
        });

        if (res.status === 401) {
          window.location.href = '/';
          return;
        }
        if (res.status === 429) {
          alert("이미 연장 요청한 항목입니다.");
          return;
        }

        if (!res.ok) throw new Error('연장 실패');
        if (isAdmin) {
          await MySwal.fire({
            icon: 'success',
            title: `해당 슬롯이 ${daysToExtend}일 연장되었습니다.`,
            color: '#000',
            confirmButtonColor: '#282828',
          });
        }else{
          await MySwal.fire({
            icon: 'success',
            title: `해당 슬롯이 ${daysToExtend}일 연장 요청되었습니다.`,
            text: `관리자 승인 후 연장됩니다.`,
            color: '#000',
            confirmButtonColor: '#282828',
          });
        }

        await fetchSlots();
      } catch (error) {
        console.error(error);
        MySwal.fire({
          icon: 'error',
          title: '연장 중 오류가 발생했습니다.',
          color: '#000',
          confirmButtonColor: '#282828',
        });
      }
    };

  const openExcelPopup = async () => {
  const res = await fetch('/api/me', { credentials: 'include' });
   if (res.status === 401) {
        window.location.href = '/';
        return; // 이후 코드 실행 막기 위해 return
  }
  if (selectedIds.length === 0) {
    alert("선택된 슬롯이 없습니다");
    return;
  }

  const popupWidth = 1200;
  const popupHeight = 900;
  const left = window.screenX + (window.outerWidth - popupWidth) / 2;
  const top = window.screenY + (window.outerHeight - popupHeight) / 2;

  const popup = window.open(
    '/exceldownloadpopup',
    'exceldownloadWindow',
    `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
  );

  if (popup) {
    const handlePopupReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data !== 'popup-ready') return;

      // 데이터 전송
      popup.postMessage(
        {
          targetSlot,
          selectedIds,
        },
        window.location.origin
      );

      // 이벤트 리스너 제거 (중복 방지)
      window.removeEventListener('message', handlePopupReady);
    };

    // 이벤트 리스너 등록
    window.addEventListener('message', handlePopupReady);
  }
};

    const openExcelTotalPopup = async () => {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.status === 401) {
            window.location.href = '/';
            return; // 이후 코드 실행 막기 위해 return
      }
      const popupWidth = 1200;
      const popupHeight = 900;
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;

      const popup = window.open(
        '/exceltotaldownloadpopup',
        'exceltotaldownloadWindow',
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
      );

      if (popup) {
        const handlePopupReady = async (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data !== 'popup-ready') return;

          const params = new URLSearchParams({
            search,
            rankOption: rankOption.toString(),
            page: page.toString(),
            pageSize: itemsPerPage.toString(),
            slotSearchType :slotSearchType.toString(),
          });



          try {
            const res = await fetch(`/api/slots/all?${params}`, {
              method: 'GET',
            });
            if (!res.ok) throw new Error('전체 슬롯 불러오기 실패');
            const json = await res.json();

            const allSlots = json.data ?? [];

            // 팝업에 전체 슬롯 전달
            popup.postMessage(
              {
                targetSlot: allSlots,
                selectedIds: allSlots.map((slot: any) => slot.seq), // 전체 선택으로 가정
              },
              window.location.origin
            );

            window.removeEventListener('message', handlePopupReady);
          } catch (err) {
            console.error('전체 다운로드 실패:', err);
            alert('전체 슬롯 데이터를 가져오는 데 실패했습니다.');
            popup.close();
          }
        };

        window.addEventListener('message', handlePopupReady);
      }
    };

     const openExcelSpecPopup = async () => {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.status === 401) {
            window.location.href = '/';
            return; // 이후 코드 실행 막기 위해 return
      }
    // const { value } = await Swal.fire({
    //     title: '기간 선택',
    //     html: `
    //       <label>시작일: </label>
    //       <input type="date" id="startDate" class="swal2-input" min="2025-01-01" max="2030-12-31">
    //       <label>종료일: </label>
    //       <input type="date" id="endDate" class="swal2-input" min="2025-01-01" max="2030-12-31">
    //     `,
    //     focusConfirm: false,
    //     showCancelButton: true,
    //     confirmButtonText: '확인',
    //     cancelButtonText: '취소',
    //     preConfirm: () => {
    //       const startInput = (document.getElementById('startDate') as HTMLInputElement).value;
    //       const endInput = (document.getElementById('endDate') as HTMLInputElement).value;

    //       if (!startInput || !endInput) {
    //         Swal.showValidationMessage('시작일과 종료일 모두 선택해야 합니다.');
    //         return;
    //       }

    //       if (startInput > endInput) {
    //         Swal.showValidationMessage('종료일은 시작일 이후여야 합니다.');
    //         return;
    //       }

    //       return {
    //         startDate: `${startInput} 00:00:00.000`,
    //         endDate: `${endInput} 00:00:00.000`,
    //       };
    //     },
    //   });
    // 다중 추출시

      const { value: selectedDate } = await Swal.fire({
        title: '날짜를 선택하세요',
        input: 'date', // 날짜 선택 창
        inputLabel: '날짜',
        inputPlaceholder: 'YYYY-MM-DD',
        showCancelButton: true, // 취소 버튼 표시
        confirmButtonText: '확인',
        cancelButtonText: '취소',
        inputAttributes: {
          min: '2025-01-01', // 선택 가능한 최소 날짜
          max: '2030-12-31', // 선택 가능한 최대 날짜
        },
      });

      if (selectedDate) {
        const formattedDate = `${selectedDate} 00:00:00.000`;
        const popupWidth = 1200;
        const popupHeight = 900;
        const left = window.screenX + (window.outerWidth - popupWidth) / 2;
        const top = window.screenY + (window.outerHeight - popupHeight) / 2;

        const popup = window.open(
          '/excelspecdownloadpopup',
          'excelspecdownloadWindow',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
        );

        if (popup) {
          const handlePopupReady = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.data !== 'popup-ready') return;

            const params = new URLSearchParams({
              search,
              endDate: formattedDate,
              rankOption: rankOption.toString(),
              slotSearchType : slotSearchType.toString(),
            });



            try {
              const res = await fetch(`/api/slots/spec?${params}`, {
                method: 'GET',
              });
              if (!res.ok) throw new Error('전체 슬롯 불러오기 실패');
              const json = await res.json();

              const allSlots = json.data ?? [];

              // 팝업에 전체 슬롯 전달
              popup.postMessage(
                {
                  targetSlot: allSlots,
                  selectedIds: allSlots.map((slot: any) => slot.seq), // 전체 선택으로 가정
                },
                window.location.origin
              );

              window.removeEventListener('message', handlePopupReady);
            } catch (err) {
              console.error('특정 다운로드 실패:', err);
              alert('특정 슬롯 데이터를 가져오는 데 실패했습니다.');
              popup.close();
            }
          };

          window.addEventListener('message', handlePopupReady);
        }
      }
    };



  useEffect(()=>{
    setSelectAll(false)
  },[page])

  const openExcelUploadPopup = async () => {
    const res = await fetch('/api/me', { credentials: 'include' });
    if (res.status === 401) {
      window.location.href = '/';
      return; // 이후 코드 실행 막기 위해 return
    }
    const popupWidth = 1200;
    const popupHeight = 900;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;

    const popup = window.open(
      '/exceluploadpopup',
      'exceluploadWindow',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
    );
 
  };

  const [rankingLoadingSlotSeq, setRankingLoadingSlotSeq] = useState<number | null>(null);

    const fetchCheckSlot = async (seq: number) => {
      setRankingLoadingSlotSeq(seq); // 로딩 시작

      try {

  
        //fetch(`http://localhost:8032/check_slot/${seq}`, { method: 'GET' }).catch(() => {}) // 디버깅
        fetch(`http://target-reward.shop/rank/check_slot/${seq}`, { method: 'GET' }).catch(() => {})
        alert(`순위체크 요청하였습니다\n5분 뒤 다시 확인해주세요.`);
    
      } finally {
        setRankingLoadingSlotSeq(null); // 로딩 종료
      }
    };




  return (
    <div className="px-8 py-6 bg-white text-black min-h-screen rounded-lg shadow-lg">
      <div className="mb-3 w-full">
        {/* 1행: 검색 / 필터 */}
        <div className="flex items-start gap-2 flex-wrap w-full">
          {/* 왼쪽: 검색창 */}
          <div className="flex items-center gap-2 flex-1 min-w-0 max-w-[750px]">
          <input
            type="text"
            placeholder="아이디, 키워드, 상품명, 링크,벤더"
            className="bg-white text-black border text-xs border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#282828] flex-1 min-w-[450px] max-w-[450px]"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <select
            className="border px-3 py-2 rounded-md text-xs"
            value={rankOption}
            onChange={(e) => {
              setRankOption(Number(e.target.value) as -1 | 0 | 1);
              setPage(1);
            }}
          >
            <option value={0}>
              순위 조회
            </option>
            <option  value={-1}>
              순위 하락
            </option>
            <option value={1}>
              순위 상승
            </option>
          </select>

          {/* 날짜 선택 필터 */}
          <div className="flex items-center gap-2 flex-nowrap">
            <ReactDatePicker
              className="min-w-[100px] max-w-[100px] h-8 px-2 border border-gray-300 rounded text-sm"
              dateFormat="yyyy/M/d"
              selected={selectedDate1}
              onChange={(date) => {
                if (date) {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  setSelectedDate1(d);
                  setStartSearchStartDate(d);
                }
              }}
              placeholderText="검색 시작일"
              shouldCloseOnSelect
              maxDate={addMonths(new Date(), 4)}
              locale={ko}
            />
            <span>~</span>
            <ReactDatePicker
              className="min-w-[100px] max-w-[100px] h-8 px-2 border border-gray-300 rounded text-sm"
              dateFormat="yyyy/M/d"
              selected={selectedDate2}
              onChange={(date) => {
                if (date) {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  setSelectedDate2(d);
                  setStartSearchEndDate(d);
                }
              }}
              placeholderText="검색 종료일"
              shouldCloseOnSelect
              maxDate={addMonths(new Date(), 4)}
              locale={ko}
            />
          </div>

          {/* 슬롯 기간 필터 */}
          {/* <div className="flex items-center gap-2 flex-nowrap">
            <ReactDatePicker
              className="min-w-[100px] max-w-[100px] h-8 px-2 border border-gray-300 rounded text-sm"
              dateFormat="yyyy/M/d"
              selected={selectedDate3}
              onChange={(date) => {
                if (date) {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  setSelectedDate3(d);
                  setEndSearchStartDate(d);
                }
              }}
              placeholderText="종료일 검색"
              shouldCloseOnSelect
              maxDate={addMonths(new Date(), 4)}
              locale={ko}
            />
            <span>~</span>
            <ReactDatePicker
              className="min-w-[100px] max-w-[100px] h-8 px-2 border border-gray-300 rounded text-sm"
              dateFormat="yyyy/M/d"
              selected={selectedDate4}
              onChange={(date) => {
                if (date) {
                  const d = new Date(date);
                  d.setHours(0, 0, 0, 0);
                  setSelectedDate4(d);
                  setEndSearchEndDate(d);
                }
              }}
              placeholderText="종료일 검색"
              shouldCloseOnSelect
              maxDate={addMonths(new Date(), 4)}
              locale={ko}
            />
          </div> */}

          
          </div>
        </div>

        {/* 2행: 버튼 영역 */}
        <div className="mt-2 flex items-center gap-2 justify-between w-full">
          <div className="flex items-center gap-2">
            <button
              style={{ display: currentUser && (currentUser.excelAllow==1)? '':'none' }}
              className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded text-sm whitespace-nowrap"
              onClick={openExcelPopup}
            >
              엑셀 다운로드
            </button>

            <button
              style={{ display: currentUser && (currentUser.excelAllow==1)? '':'none' }}
              className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded text-sm whitespace-nowrap"
              onClick={openExcelTotalPopup}
            >
              엑셀 전체 다운로드
            </button>

            <button
              style={{ display: currentUser && (currentUser.excelAllow==1) && currentUser.role ==0 ? '':'none' }}
              className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded text-sm whitespace-nowrap"
              onClick={openExcelSpecPopup}
            >
              엑셀 일부 다운로드
            </button>

            <button
              style={{ display: currentUser && currentUser.excelAllow === 1 ? '' : 'none' }}
              className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded text-sm whitespace-nowrap"
              onClick={openExcelUploadPopup}
            >
              엑셀 업로드
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="border px-3 py-2 rounded-md text-xs"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[10, 20, 50,100,150,300].map((num) => (
                <option key={num} value={num}>
                  {num}개씩
                </option>
              ))}
            </select>

            <button
              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm"
               style={{ display: currentUser && (currentUser.role==0)? '':'none' }}
              onClick={handleDelete}
            >
              삭제
            </button>
            <button
              className="bg-[#282828] hover:bg-[#141414] text-white px-3 py-2 rounded text-sm"
              onClick={handleEdit}
            >
              수정
            </button>
            <button
              className="bg-[#9760ff] text-white px-3 py-2 rounded hover:bg-[#651eeb] text-sm"
              onClick={handleExtend}
            >
              연장
            </button>
          </div>
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
              selectAll={selectAll}
              handleSelectAll={handleSelectAll}
              handleCheckboxChange={handleCheckboxChange}
              formatDate={formatDate}
              editIndex={editIndex}
              editedSlot={editedSlot}
              handleInputChange={handleInputChange}
              handleConfirm={handleConfirm}
              handleCancel={handleCancel}
              showActions={true}
              setRankingSlotSeq={setRankingSlotSeq}
              handleEditClick={handleEditClick}
              handleSingleDelete={handleSingleDelete}
              handleSingleExtend={handleSingleExtend}
              fetchCheckSlot={fetchCheckSlot}
              currentUser={currentUser}
              rankingLoadingSlotSeq={rankingLoadingSlotSeq}
              showCheckbox={true}
              showActionColumn={true}
            />
          )}

          {rankingSlotSeq !== null && (
            <SlotRankingModal
              slotSeq={rankingSlotSeq}
              onClose={() => setRankingSlotSeq(null)}
            />
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

export default SlotList;
