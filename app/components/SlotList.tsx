'use client';

import SlotRankingModal from '@/components/modals/SlotRankingModal';
import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

interface Slot {
  seq: number;
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
  rank: string;
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
  singleLink : string;
  status: boolean;
  createdAt: string;
  errMsg: string;
  sceretKeyLinkType1: number|null;
  sceretKeyLinkType2: number|null;
  sceretKeyLinkType3: number|null;
  sceretKeyLinkType4: number|null;
  keywordLimit: number;
  comparePriceLowestPrice: number;
  comparePriceURL: string;
  comparePriceSalePlaceCount: number;
  comparePriceTitle: string;
  productPrice: number;
  answerTagList: string;
  storeName: string;
  extraTime: string;
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number; excelAllow:number; additionalRegAllow:number; slotAllow:number; userAllow: number; rankingCheckAllow:number; }  | null>(null);
  const [showExcelUploadPopup, setShowExcelUploadPopup] = useState(false);

  const [time, setTime] = useState<{ open_start_time: string; open_end_time: string; edit_start_time: string; edit_end_time:string;} | null>(null);

  const [newSlot, setNewSlot] = useState<Partial<Slot>>({
    productLink: '',
    keyword: '',
    startDate: '',
    endDate: '',
  });


  const [targetSlot,setTargetSlot] = useState<Slot[]>([]); //키워드
  const router = useRouter();


  //모달 변수
  const [additionalModalOpen, setAdditionalModalOpen] = useState(false); //모달


  const [isKeyword, setIsKeyword] = useState<boolean>(false);
  const [keyword, setKeyword] = useState("");
  const [secretKey1, setSecretKey1] = useState("");
  const [secretKey2, setSecretKey2] = useState("");
  const [secretKey3, setSecretKey3] = useState("");
  const [secretKey4, setSecretKey4] = useState("");


  const [sceretKeyLinkType1, setSceretKeyLinkType1] = useState(0);
  const [sceretKeyLinkType2, setSceretKeyLinkType2] = useState(0);
  const [sceretKeyLinkType3, setSceretKeyLinkType3] = useState(0);
  const [sceretKeyLinkType4, setSceretKeyLinkType4] = useState(0);


  const [secretLandingKey1, setSecretLandingKey1] = useState("");
  const [secretLandingKey2, setSecretLandingKey2] = useState("");
  const [secretLandingKey3, setSecretLandingKey3] = useState("");
  const [secretLandingKey4, setSecretLandingKey4] = useState("");
  const [keywordLimit,setKeywordLimit] = useState<number|null>(null);

  const [currentSort,setCurrentSort] = useState<number|null>(null);
  const [selectedModalSlot, setSelectedModalSlot] = useState<Slot|null>(null);

  const [isInitialOpen, setIsInitialOpen] = useState(false);
  const [hasInitializedModal, setHasInitializedModal] = useState(false);


  const [rankOption, setRankOption] = useState<-1 | 0 | 1>(0);
  const [weekendOpen,setWeekendOpen] = useState<boolean>(false);


  useEffect(() => {
   if (selectedModalSlot && additionalModalOpen && !hasInitializedModal) {

     const isKeywordMode = selectedModalSlot.sortation !== 2;
     setIsKeyword(isKeywordMode);

      if (selectedModalSlot.sortation == 2)
        setIsKeyword(false);
      else
        setIsKeyword(true);
      setCurrentSort(selectedModalSlot.sortation);

      setKeyword(selectedModalSlot.keyword || "");

      setSecretKey1(selectedModalSlot.secretKey1 || "");
      setSecretKey2(selectedModalSlot.secretKey2 || "");
      setSecretKey3(selectedModalSlot.secretKey3 || "");
      setSecretKey4(selectedModalSlot.secretKey4 || "");


      setSceretKeyLinkType1(selectedModalSlot.sceretKeyLinkType1 || 0);
      setSceretKeyLinkType2(selectedModalSlot.sceretKeyLinkType2 || 0);
      setSceretKeyLinkType3(selectedModalSlot.sceretKeyLinkType3 || 0);
      setSceretKeyLinkType4(selectedModalSlot.sceretKeyLinkType4 || 0);

      setSecretLandingKey1(selectedModalSlot.secretLandingKey1 ||"");
      setSecretLandingKey2(selectedModalSlot.secretLandingKey2 ||"");
      setSecretLandingKey3(selectedModalSlot.secretLandingKey3 ||"");
      setSecretLandingKey4(selectedModalSlot.secretLandingKey4 ||"");

      setKeywordLimit(selectedModalSlot.keywordLimit);
      setHasInitializedModal(true); // ✅ 한 번만 실행되도록
   }
 }, [selectedModalSlot, additionalModalOpen, hasInitializedModal]);



  const handleCancelModal = () => {
    setAdditionalModalOpen(false);
    setSelectedModalSlot(null);
    setHasInitializedModal(false); // 다음에 다시 초기화 허용
  };

 const handleConfirmModal = async (seq: number) => {
    // 쇼검, 통검, 플러스 강제 선택
    if (isKeyword) {
        const secretKeys = [secretKey1, secretKey2, secretKey3, secretKey4];
        const linkTypes = [
          sceretKeyLinkType1,
          sceretKeyLinkType2,
          sceretKeyLinkType3,
          sceretKeyLinkType4,
        ];

        const hasUnselected = linkTypes.slice(0, keywordLimit??4).some(type => type === 0);

        //const hasUnselected = linkTypes
        //    .slice(0, keywordLimit)
        //    .some((type, idx) => {
        //      // 해당 시크릿 키워드가 비어있으면 방식 미선택 허용
        //      if (!secretKeys[idx] || secretKeys[idx].trim() === "") {
        //        return false;
        //      }
        //      return type === 0; // 키워드가 있으면 방식 반드시 선택
        //    });

          if (hasUnselected) {
            alert("모든 시크릿 키워드의 방식을 선택해주세요.");
            return;
          }
           const hasEmpty = secretKeys.slice(0, keywordLimit??4).some(
              (key) => !key || key.trim() === ""
            );
           if (hasEmpty) {
              alert("모든 시크릿 키워드를 입력해주세요.");
              return;
            }

    }

         if (!isKeyword) {
            const landingKeys = [
              secretLandingKey1,
              secretLandingKey2,
              secretLandingKey3,
              secretLandingKey4,
            ];

            const hasEmptyLanding = landingKeys.slice(0, keywordLimit??4).some(
              (key) => !key || key.trim() === ""
            );

            if (hasEmptyLanding) {
              alert("모든 시크릿 랜딩을 입력해주세요.");
              return;
            }
          }

    const sortation = isKeyword == true ? 1:2;
    const formData = {
      sortation,
      keyword,
      secretKey1,
      secretKey2,
      secretKey3,
      secretKey4,
      currentSort,
      secretLandingKey1,
      secretLandingKey2,
      secretLandingKey3,
      secretLandingKey4,
      sceretKeyLinkType1,
      sceretKeyLinkType2,
      sceretKeyLinkType3,
      sceretKeyLinkType4,

    };
   try {
     const res = await fetch('/api/slots/keyword', {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ seqs: [seq], formData }),
     });

     if (!res.ok) {
      if (res.status === 401) {
        router.push('/');
        return;
      }

       throw new Error('저장 실패');
     }

     setEditIndex(null);
     alert("성공적으로 수정하였습니다.");
     await fetchSlots();
   } catch (err) {
     console.error(err);
     alert('저장 중 오류가 발생했습니다.');
   }

    setAdditionalModalOpen(false);
    setSelectedModalSlot(null);
    setHasInitializedModal(false);
    setSelectedIds([]);
    setTargetSlot([]);
    setSelectAll(false);
 };


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
        setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role),excelAllow: Number(user.excelAllow), additionalRegAllow:  Number(user.additionalRegAllow), slotAllow: Number(user.slotAllow), userAllow:Number(user.userAllow), rankingCheckAllow:Number(user.rankingCheckAllow)});
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
      const params = new URLSearchParams({
        search,
        rankOption: rankOption.toString(),
        page: page.toString(),
        pageSize: itemsPerPage.toString(),
        slotSearchType :slotSearchType.toString(),
      });



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
  }, [search, page, itemsPerPage,searchStart]);



  const handleEditClick = (index: number) => {
    const now = new Date();
    const nowTime = now.toTimeString().slice(0,8);
    const day = now.getDay(); // 0: 일요일, 6: 토요일


    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    if(nowTime< editStartTime || nowTime>editEndTime){
      alert(`현시각에는 수정이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
      return;
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

  const handleSortationChange = (field: keyof Slot, value: string) => {
    const updatedSlot = { ...editedSlot, [field]: value };
    setEditedSlot(updatedSlot);
  };



  const handleInputChange = (field: keyof Slot, value: string) => {
    const updatedSlot = { ...editedSlot, [field]: value };
    setEditedSlot(updatedSlot);
  };


  const handleConfirm = async (seq: number) => {
    try {
      // editedSlot에는 현재 편집 중인 슬롯 데이터가 있다고 가정
      const updateData = { ...editedSlot };

      // 공백 제거 (특히 productLink)
      if (updateData.productLink) {
        updateData.productLink = updateData.productLink.trim();
      }
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

    if(nowTime< editStartTime || nowTime>editEndTime){
      alert(`현시각에는 삭제가 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
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

    if(nowTime< editStartTime || nowTime>editEndTime){
      alert(`현시각에는 삭제가 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
      return;
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
    changes: { productLink?: string; keyword?: string; }
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
      const err = await response.text();
      throw new Error(err || 'Failed to update slots');
    }
  };

  const handleEdit = async () => {

    const now = new Date();
    const nowTime = now.toTimeString().slice(0,8);
    const day = now.getDay(); // 0: 일요일, 6: 토요일

    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    if(nowTime< editStartTime || nowTime>editEndTime){
      alert(`현시각에는 수정이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
      return;
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
        `<input id="swal-input2" class="swal2-input" placeholder="원부 URL">` +
        `<input id="swal-input3" class="swal2-input" placeholder="단일 URL">`,
      focusConfirm: false,
      didOpen: () => {
        const productLinkInput = document.getElementById('swal-input1') as HTMLInputElement;

        productLinkInput.addEventListener('input', () => {
          const rawValue = productLinkInput.value;
          const trimmedValue = rawValue.trim();
          productLinkInput.value = trimmedValue;  // 입력란에도 공백 제거 반영
        });

      },
      preConfirm: () => {
        const keyword = (document.getElementById('swal-input1') as HTMLInputElement).value.trim();
        const productLink = (document.getElementById('swal-input2') as HTMLInputElement).value.trim();
        const singleLink = (document.getElementById('swal-input3') as HTMLInputElement).value.trim();

        if (!singleLink && !keyword && !productLink) {
          MySwal.showValidationMessage('최소 하나는 입력해야 합니다.');
          return null;
        }

        return {
          ...(singleLink && { singleLink }),
          ...(productLink && {productLink}),
          ...(keyword && { keyword }),
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
        text: '문제가 발생했습니다. 다시 시도해주세요.',
        confirmButtonColor: '#282828',
      });
    }
  };


  const handleExtend = async () => {
    const now = new Date();

    const nowTime = now.toTimeString().slice(0,8);

    const editStartTime = time?.edit_start_time || "23:59:59";
    const editEndTime = time?.edit_end_time || "00:00:00";

    if(nowTime< editStartTime || nowTime>editEndTime){
      alert(`현시각에는 연장이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
      return;
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

      if (nowTime < editStartTime || nowTime > editEndTime) {
        alert(`현시각에는 연장이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
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
            slotSearchType : slotSearchType.toString(),
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

        //const res = fetch(`http://14.7.33.34/rank/check_slot/${seq}`, {

        fetch(`http://14.7.33.34/rank/check_slot/${seq}`, { method: 'GET' }).catch(() => {})
        //fetch(`http://localhost:8011/check_slot/${seq}`, { method: 'GET' }).catch(() => {}) // 디버깅
        alert(`순위체크 요청하였습니다\n5분 뒤 다시 확인해주세요.`);
        // if (!res.ok) throw new Error('순위체크 실패');

      } finally {
        setRankingLoadingSlotSeq(null); // 로딩 종료
      }
    };




  return (
    <div className="px-8 py-6 bg-white text-black min-h-screen rounded-lg shadow-lg">
      <div className="mb-3 flex items-center gap-2 justify-between w-full">
        {/* 왼쪽: 검색창 */}
        <div className="flex items-center gap-2 w-[750px]">
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
          {
            <button
            style={{ display: currentUser && (currentUser.excelAllow==1) && currentUser.role ==0 ? '':'none' }}
            className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded text-sm whitespace-nowrap"
            onClick={openExcelSpecPopup}
          >
            엑셀 일부 다운로드
          </button>
          }
{/*
          <button
            style={{ display: currentUser && currentUser.excelAllow === 1 ? '' : 'none' }}
            className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded text-sm whitespace-nowrap"
            onClick={openExcelUploadPopup}
          >
            엑셀 업로드
          </button> */}

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
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="text-xs w-full text-center bg-white rounded-lg overflow-hidden border border-gray-200">
                <thead className="text-xs bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-5 py-4 border-b border-gray-300">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>

                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">번호</th>
                    {(isAdmin || isDistributor) && (
                      <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">타입</th>
                    )}
                    {isAdmin && (
                      <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">총판 ID</th>
                    )}

                    {(isAdmin || isDistributor) && (
                      <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">대행사 ID</th>
                    )}
                     <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">접수일</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis" style={{ display:  currentUser?.additionalRegAllow === 1 ? '':'none' }}>구분</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">상태</th>
                    {currentUser?.additionalRegAllow === 1 && (
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">추가등록</th>
                    )}
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">사용자 ID</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">썸네일</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">키워드</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">원부 링크</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">단일 링크</th>
                    {/* <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">가격비교상품 제목</th> */}
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">시작일</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">종료일</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">메모</th>
                    <th className="px-5 py-4 border-b border-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">액션</th>
                  </tr>
                </thead>

                <tbody>
                  {slots.map((slot, index) => {
                    const isEditing = editIndex === index;
                    const hasProductLink = Boolean(slot.productLink && slot.productLink.trim());
                    const isCompareOK =
                      (slot.productPrice ?? 0) > 0 && (!hasProductLink ||
                      (
                        (slot.comparePriceLowestPrice ?? 0) > 0 &&
                        (slot.comparePriceSalePlaceCount ?? 0) > 0
                      ));
                    return (
                      <tr
                        key={slot.seq}
                        className="hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis"
                      >
                        <td className="p-3 border-b border-gray-200">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(slot.seq)}
                            onChange={() => handleCheckboxChange(slot.seq)}
                          />
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {slot.seq}
                        </td>
                        {(isAdmin || isDistributor) && (
                        <td className="p-3 border-b border-gray-200">
                          {
                            slot.extraTime == "0" ? (`엘릭서 ${slot.keywordLimit}`) : ("엘릭서 5")
                          }
                        </td>
                        )}
                        {isAdmin && (
                          <>
                            {slot.distributorId ? (
                              <Tooltip.Provider delayDuration={100}>
                                <Tooltip.Root>
                                  <Tooltip.Trigger asChild>
                                    <td className="p-3 border-b border-gray-200 max-w-[70px] whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer">
                                      {slot.distributorId}
                                    </td>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      side="top"
                                      className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px]"
                                      sideOffset={5}
                                    >
                                      {slot.distributorId}
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                            ) : (
                              <td className="p-3 border-b border-gray-200 max-w-[70px] text-center">-</td>
                            )}

                            {slot.agencyId ? (
                              <Tooltip.Provider delayDuration={100}>
                                <Tooltip.Root>
                                  <Tooltip.Trigger asChild>
                                    <td className="p-3 border-b border-gray-200 max-w-[70px] whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer">
                                      {slot.agencyId}
                                    </td>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      side="top"
                                      className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px]"
                                      sideOffset={5}
                                    >
                                      {slot.agencyId}
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                            ) : (
                              <td className="p-3 border-b border-gray-200 max-w-[70px] text-center">-</td>
                            )}
                          </>
                        )}

                        {isDistributor && !isAdmin && (
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {slot.distributorId || '-'}
                          </td>
                        )}
                        <td className="p-3 border-b border-gray-200">
                          {formatDate(slot.createdAt)}
                        </td>
                        {
                          (isEditing && currentUser?.additionalRegAllow === 1) ? (
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words"
                              style={{ display:  currentUser?.additionalRegAllow === 1 ? '':'none' }}
                            >
                              <select
                                name=""
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
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words"
                            style={{ display:  currentUser?.additionalRegAllow === 1 ? '':'none' }}
                            >
                              <span className="whitespace-nowrap">
                                {slot.sortation === 1
                                  ? '키워드'
                                  : slot.sortation === 2
                                  ? '랜딩'
                                  : '-'}
                              </span>
                            </td>
                          )
                        }



                        <td className="p-3 border-b border-gray-200 max-w-[30px] break-words">
                            <Tooltip.Provider delayDuration={100}>

                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                   <div className="flex justify-center items-center gap-2">
                                    <div
                                      className={`w-2.5 h-2.5 rounded-full ${
                                       slot.status && slot.sortation!=0 &&
                                       slot.thumbnail && (slot.productPrice&& slot.productPrice!=0)&&slot.answerTagList&&slot.storeName && slot.productId &&
                                       ((!slot.productLink) || (slot.comparePriceLowestPrice && slot.comparePriceURL && slot.comparePriceSalePlaceCount)) &&
                                       isCompareOK && (
                                          (slot.keywordLimit === 4 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1 != null || slot.secretLandingKey2 != null || slot.secretLandingKey3 != null || slot.secretLandingKey4 != null)) ||
                                              (slot.sortation === 1 && (slot.secretKey1 != null || slot.secretKey2 != null || slot.secretKey3 != null || slot.secretKey4 != null))
                                          )) ||
                                          (slot.keywordLimit === 3 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1 != null || slot.secretLandingKey2 != null || slot.secretLandingKey3 != null)) ||
                                              (slot.sortation === 1 && (slot.secretKey1 != null || slot.secretKey2 != null || slot.secretKey3 != null))
                                          )) ||
                                          (slot.keywordLimit === 2 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1 != null || slot.secretLandingKey2 != null)) ||
                                              (slot.sortation === 1 && (slot.secretKey1 != null || slot.secretKey2 != null))
                                          )) ||
                                          (slot.keywordLimit === 1 && (
                                              (slot.sortation === 2 && slot.secretLandingKey1 != null) ||
                                              (slot.sortation === 1 && slot.secretKey1 != null)
                                          ))
                                        )
                                       ?  'bg-green-500' : 'bg-red-500'
                                      }`}
                                    ></div>
                                    <span
                                      className={`${slot.status && slot.sortation!=0  &&
                                       slot.thumbnail && (slot.productPrice&& slot.productPrice!=0)&&slot.answerTagList&&slot.storeName && slot.productId &&
                                        ((!slot.productLink) || (slot.comparePriceLowestPrice && slot.comparePriceURL && slot.comparePriceSalePlaceCount)) &&
                                          isCompareOK && (
                                          (slot.keywordLimit === 4 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1  || slot.secretLandingKey2  || slot.secretLandingKey3  || slot.secretLandingKey4 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1 || slot.secretKey2  || slot.secretKey3  || slot.secretKey4 ))
                                          )) ||
                                          (slot.keywordLimit === 3 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1  || slot.secretLandingKey2  || slot.secretLandingKey3 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1 || slot.secretKey2 || slot.secretKey3 ))
                                          )) ||
                                          (slot.keywordLimit === 2 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1  || slot.secretLandingKey2 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1  || slot.secretKey2 ))
                                          )) ||
                                          (slot.keywordLimit === 1 && (
                                              (slot.sortation === 2 && slot.secretLandingKey1 ) ||
                                              (slot.sortation === 1 && slot.secretKey1 )
                                          ))
                                        )
                                         ? 'text-green-600' : 'text-red-600'} ${currentUser?.additionalRegAllow === 1 ? 'cursor-pointer' : ''}`}
                                      onClick={() => {

                                        if(currentUser?.additionalRegAllow === 1){
                                          const params = new URLSearchParams({
                                            seq:slot.seq.toString(),
                                            thumbnail: slot.thumbnail || '',
                                            productPrice: slot.productPrice?.toString() || '',
                                            answerTagList: slot.answerTagList || '',
                                            storeName: slot.storeName || '',
                                            productLink: slot.productLink || '',
                                            comparePriceLowestPrice: slot.comparePriceLowestPrice?.toString()||'',
                                            comparePriceURL: slot.comparePriceURL ||'',
                                            comparePriceSalePlaceCount: slot.comparePriceSalePlaceCount?.toString()||'',
                                            productId: slot.productId||''
                                          }).toString();

                                          const popupWidth = 1000;
                                          const popupHeight = 500;
                                          const left = window.screenX + (window.outerWidth - popupWidth) / 2;
                                          const top = window.screenY + (window.outerHeight - popupHeight) / 2;

                                          window.open(
                                            `/fixpopup?${params}`,
                                            'fixpopupWindow',
                                            `width=${popupWidth},height=${popupHeight},left=${left},top=${top}`
                                          );
                                        }

                                      }}
                                    >
                                      {slot.status && slot.sortation!=0   &&
                                       slot.thumbnail && (slot.productPrice&& slot.productPrice!=0)&&slot.answerTagList&&slot.storeName && slot.productId &&
                                          ((!slot.productLink) || (slot.comparePriceLowestPrice && slot.comparePriceURL && slot.comparePriceSalePlaceCount)) &&
                                          isCompareOK && (
                                          (slot.keywordLimit === 4 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1 && slot.secretLandingKey2  && slot.secretLandingKey3  && slot.secretLandingKey4)) ||
                                              (slot.sortation === 1 && (slot.secretKey1 || slot.secretKey2  || slot.secretKey3  || slot.secretKey4 ))
                                          )) ||
                                          (slot.keywordLimit === 3 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1  && slot.secretLandingKey2  && slot.secretLandingKey3 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1  || slot.secretKey2 || slot.secretKey3 ))
                                          )) ||
                                          (slot.keywordLimit === 2 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1  && slot.secretLandingKey2 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1  && slot.secretKey2 ))
                                          )) ||
                                          (slot.keywordLimit === 1 && (
                                              (slot.sortation === 2 && slot.secretLandingKey1 ) ||
                                              (slot.sortation === 1 && slot.secretKey1 )
                                          ))
                                        )
                                         ? '정상' : '오류'}
                                    </span>
                                  </div>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                   <Tooltip.Content
                                    side="top"
                                    forceMount
                                    className={`
                                      bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px]
                                      ${((slot.status && slot.sortation!=0  &&

                                        (
                                          (slot.keywordLimit === 4 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1 && slot.secretLandingKey2 && slot.secretLandingKey3  && slot.secretLandingKey4 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1  || slot.secretKey2 || slot.secretKey3 || slot.secretKey4 ))
                                          )) ||
                                          (slot.keywordLimit === 3 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1  && slot.secretLandingKey2  && slot.secretLandingKey3 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1  || slot.secretKey2 || slot.secretKey3 ))
                                          )) ||
                                          (slot.keywordLimit === 2 && (
                                              (slot.sortation === 2 && (slot.secretLandingKey1 && slot.secretLandingKey2 )) ||
                                              (slot.sortation === 1 && (slot.secretKey1 && slot.secretKey2 ))
                                          )) ||
                                          (slot.keywordLimit === 1 && (
                                              (slot.sortation === 2 && slot.secretLandingKey1) ||
                                              (slot.sortation === 1 && slot.secretKey1)
                                          )))
                                         )&& (isCompareOK))  ? 'hidden' : ''}
                                    `}
                                    sideOffset={10}
                                  >

                                    {

                                    (slot.sortation==0   ||(
                                          (slot.keywordLimit === 4 && (
                                              (slot.sortation === 2 && (!slot.secretLandingKey1 || !slot.secretLandingKey2 || !slot.secretLandingKey3|| !slot.secretLandingKey4 )) ||
                                              (slot.sortation === 1 && (!slot.secretKey1 || !slot.secretKey2  || !slot.secretKey3 || !slot.secretKey4 ))
                                          )) ||
                                          (slot.keywordLimit === 3 && (
                                              (slot.sortation === 2 && (!slot.secretLandingKey1  || !slot.secretLandingKey2 || !slot.secretLandingKey3)) ||
                                              (slot.sortation === 1 && (!slot.secretKey1 || !slot.secretKey2 || !slot.secretKey3))
                                          )) ||
                                          (slot.keywordLimit === 2 && (
                                              (slot.sortation === 2 && (!slot.secretLandingKey1|| !slot.secretLandingKey2 )) ||
                                              (slot.sortation === 1 && (!slot.secretKey1 || !slot.secretKey2))
                                          )) ||
                                          (slot.keywordLimit === 1 && (
                                              (slot.sortation === 2 && !slot.secretLandingKey1) ||
                                              (slot.sortation === 1 && !slot.secretKey1 )
                                          ))
                                        )
                                      ? `오류 0 \n`: ``)

                                      }


                                      {((!slot.keyword || !slot.productLink || !slot.singleLink) && !slot.errMsg || slot.status==false && !slot.errMsg )
                                        ? `200위 이내에 상품이 존재하지 않습니다.\n(5분이후에도 동일할경우 재등록해주세요)`
                                      :  slot.errMsg}
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                        </Tooltip.Provider>
                       </td>
                        {currentUser?.additionalRegAllow === 1 && (
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            <Button
                              style={{
                                display: isEditing ? 'none' : '',
                              }}
                              className="bg-[#282828] hover:bg-[#141414] text-white px-2 py-1 rounded-md w-[60px]"
                              onClick={() => {

                                const now = new Date();
                                  const nowTime = now.toTimeString().slice(0,8);
                                  const day = now.getDay(); // 0: 일요일, 6: 토요일

                                  const editStartTime = time?.edit_start_time || "23:59:59";
                                  const editEndTime = time?.edit_end_time || "00:00:00";

                                  if(nowTime< editStartTime || nowTime>editEndTime){
                                    alert(`현시각에는 수정이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${editStartTime} ~ ${editEndTime}`);
                                    return;
                                  }

                                    const isWeekend = (day === 0 || day === 6);

                                  if(!weekendOpen){
                                    alert(`수정 작업이 제한되어있습니다.`);
                                    return;
                                  }



                                setSelectedModalSlot(slot);
                                setAdditionalModalOpen(true);
                              }}
                            >
                              추가등록
                            </Button>
                          </td>
                        )}

                        <td className="p-3 border-b border-gray-200 max-w-[80px] break-words" style={{ whiteSpace: 'pre-wrap' }}>
                          {slot.userId}
                        </td>
                        <td className="p-3 border-b border-gray-200 max-w-xs break-words text-center">
                          {slot.thumbnail ? (
                            <img
                              src={slot.thumbnail}
                              alt="썸네일"
                              className="w-16 h-16 object-cover rounded inline-block"
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 border-b border-gray-200 max-w-[120px]">
                          {isEditing ? (
                            <input
                              className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                              value={editedSlot.keyword || ''}
                              onChange={(e) =>
                                handleInputChange('keyword', e.target.value)
                              }
                            />
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <span className="whitespace-nowrap text-ellipsis overflow-hidden whitespace-nowrap">
                                  {slot.keyword || '-'}
                                </span>
                                {slot.rank != null && (
                                  <span
                                    className="text-blue-500 cursor-pointer hover:underline whitespace-nowrap"
                                    onClick={() => setRankingSlotSeq(slot.seq)}
                                  >
                                      {
                                      (function renderRank(rank) {
                                        const today = new Date();
                                        const todayStr = today.toISOString().split("T")[0];
                                        const dateOnly = slot.createdAt.toString().split("T")[0];
                                        let dateDiff = 1;

                                        if (dateOnly === todayStr) {
                                          dateDiff = 1;
                                        } else {
                                          const date = new Date(dateOnly);
                                          const todayDate = new Date(todayStr);

                                          const diffTime = todayDate.getTime() - date.getTime(); // 밀리초 차이
                                          dateDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 일 단위 변환
                                        }

                                        // rank가 문자열일 수도 있으니 문자열로 변환
                                        let rankStr = String(rank);
                                        let parts = rankStr.split('>');

                                        // dateDiff에 따라 출력 범위 조절
                                        if (dateDiff === 2 && parts.length > 1) {
                                          parts = parts.slice(parts.length - 2); // 마지막 2개만
                                        } else if (dateDiff === 1) {
                                          parts = [parts[parts.length - 1]]; // 마지막 1개만
                                        }

                                        if (parts.length === 1) {
                                          const num = parseInt(parts[0], 10);
                                          return num !== 0 ? `${num}위` : "순위권 밖";
                                        }

                                        return parts.map((numStr, idx) => {
                                          const num = parseInt(numStr, 10);

                                          if (idx === 0) {
                                            return num !== 0 ? (
                                              <span key={idx} style={{ color: 'black' }}>{num}</span>
                                            ) : (
                                              <span key={idx} style={{ color: 'black' }}>순위권 밖</span>
                                            );
                                          }

                                          if (num === 0) {
                                            const prevNum = parseInt(parts[idx - 1], 10);
                                            let color = prevNum === 0 ? 'black' : 'blue';
                                            let arrow = prevNum !== 0 ? '↓' : '';
                                            return (
                                              <React.Fragment key={idx}>
                                                <span style={{ color: 'black' }}> {' > '} </span>
                                                <span style={{ color }}>{"순위권 밖"} {arrow}</span>
                                              </React.Fragment>
                                            );
                                          }

                                          const prevNum = parseInt(parts[idx - 1], 10);
                                          const color = prevNum > num ? 'red' : prevNum < num ? 'blue' : 'black';
                                          const arrow = color === 'red' ? '↑' : color === 'blue' ? '↓' : '';
                                          return (
                                            <React.Fragment key={idx}>
                                              <span style={{ color: 'black' }}> {' > '} </span>
                                              <span style={{ color }}>{num} {arrow}</span>
                                            </React.Fragment>
                                          );
                                        });
                                      })(slot.rank)
                                    }
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                        <Tooltip.Provider delayDuration={100}>
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {isEditing ? (
                              <input
                                className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                                value={editedSlot.productLink || ''}
                                onChange={(e) =>
                                  handleInputChange('productLink', e.target.value)
                                }
                              />
                            ) : slot.productLink ? (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <a
                                    href={slot.productLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-700 hover:underline truncate inline-block max-w-[100px] cursor-pointer"
                                  >
                                    {slot.productLink}
                                  </a>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap w-full"
                                    sideOffset={5}
                                  >
                                    {slot.productLink}
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </Tooltip.Provider>
                         <Tooltip.Provider delayDuration={100}>
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {isEditing ? (
                              <input
                                className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                                value={editedSlot.singleLink || ''}
                                onChange={(e) =>
                                  handleInputChange('singleLink', e.target.value)
                                }
                              />
                            ) : slot.singleLink ? (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <a
                                    href={slot.singleLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-700 hover:underline truncate inline-block max-w-[100px] cursor-pointer"
                                  >
                                    {slot.singleLink}
                                  </a>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap w-full"
                                    sideOffset={5}
                                  >
                                    {slot.singleLink}
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </Tooltip.Provider>
                        {/* <td className="p-3 border-b border-gray-200 max-w-[50px]">
                            {slot.comparePriceTitle}
                        </td> */}


                        <td className="p-3 border-b border-gray-200 max-w-[50px]">
                          {isEditing ? (
                            // <input
                            //   type="date"
                            //   className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                            //   value={formatDate(editedSlot.startDate || '')}
                            //   onChange={(e) =>
                            //     handleInputChange('startDate', e.target.value)
                            //   }
                            // />
                            formatDate(slot.startDate)
                          ) : (
                            formatDate(slot.startDate)
                          )}
                        </td>
                        <td className="p-3 border-b border-gray-200 max-w-[50px]">
                          {isEditing ? (
                            // <input
                            //   type="date"
                            //   className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                            //   value={formatDate(editedSlot.endDate || '')}
                            //   onChange={(e) =>
                            //     handleInputChange('endDate', e.target.value)
                            //   }
                            // />
                            formatDate(slot.endDate)
                          ) : (
                            formatDate(slot.endDate)
                          )}
                        </td>
                        <Tooltip.Provider delayDuration={100}>
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {isEditing ? (
                              <input
                                className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                                value={editedSlot.memo || ''}
                                onChange={(e) =>
                                  handleInputChange('memo', e.target.value)
                                }
                              />
                            ) : slot.memo ? (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <span className="block max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer mx-auto">
                                    {slot.memo}
                                  </span>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[100px]"
                                    sideOffset={5}
                                  >
                                    {slot.memo}
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </Tooltip.Provider>
                        <td className="py-3 px-2 border-b border-gray-200 space-x-1 whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <Button
                                className="bg-[#9760ff] hover:bg-[#651eeb] text-white px-3 py-1 rounded-md"
                                onClick={() => handleConfirm(slot.seq)}
                              >
                                저장
                              </Button>
                              <Button
                                className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-md"
                                onClick={handleCancel}
                              >
                                취소
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                              style={{
                                display:
                                  currentUser &&
                                  currentUser.rankingCheckAllow === 1
                                  // && (!(slot.singleLink?.includes('brand.')) ||  !(slot.productLink == null||slot.productLink==""))
                                    ? ''
                                    : 'none',
                              }}
                              className="h-9 bg-[#282828] hover:bg-[#141414] text-white px-2 w-[60px] rounded-md text-[12px]"
                              onClick={() => fetchCheckSlot(slot.seq)}
                              disabled={rankingLoadingSlotSeq === slot.seq} // 중복 클릭 방지
                            >
                              {rankingLoadingSlotSeq === slot.seq ? (
                                <svg
                                  className="animate-spin !h-2 !w-2 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                  ></path>
                                </svg>
                              ) : (
                                '순위체크'
                              )}
                            </Button>
                              <Button
                                className="bg-[#282828] hover:bg-[#141414] text-white px-2 py-1 rounded-md text-[12px]"
                                onClick={() => handleEditClick(index)}
                              >
                                수정
                              </Button>
                              <Button
                                style={{ display: currentUser && (currentUser.role==0)? '':'none' }}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-[12px]"
                                onClick={() => handleSingleDelete(slot.seq)}
                              >
                                삭제
                              </Button>
                              <Button
                                className="bg-[#9760ff] hover:bg-[#651eeb] text-white px-2 py-1 rounded-md text-[12px]"
                                onClick={() => handleSingleExtend(slot.seq)}
                              >
                                연장
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
      {additionalModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">추가 정보 입력</h2>

            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      className="cursor-pointer accent-[#282828]"
                      type="radio"
                      name="type"
                      checked={isKeyword === true}
                      onChange={() => setIsKeyword(true)}
                    />
                    <span>키워드</span>
                  </label>

                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input
                      className="cursor-pointer accent-[#282828]"
                      type="radio"
                      name="type"
                      checked={isKeyword === false}
                      onChange={() => setIsKeyword(false)}
                    />
                    <span>랜딩</span>
                  </label>
                  <select
                    style={isKeyword ? {} : { display: 'none' }}

                    className="w-[100px] border px-2 py-2 rounded"
                    defaultValue={0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if(val !=0){
                        if(keywordLimit && keywordLimit>0)
                          setSceretKeyLinkType1(val)
                        if(keywordLimit && keywordLimit>1)
                          setSceretKeyLinkType2(val)
                        if(keywordLimit && keywordLimit>2)
                        setSceretKeyLinkType3(val)
                        if(keywordLimit && keywordLimit>3)
                          setSceretKeyLinkType4(val)
                      }else{
                        if(keywordLimit && keywordLimit>0)
                          setSceretKeyLinkType1(0)
                        if(keywordLimit && keywordLimit>1)
                          setSceretKeyLinkType2(0)
                        if(keywordLimit && keywordLimit>2)
                          setSceretKeyLinkType3(0)
                        if(keywordLimit && keywordLimit>3)
                          setSceretKeyLinkType4(0)

                      }
                    }}
                  >
                    <option value={0}>일괄선택</option>
                    <option value={1}>쇼검</option>
                    <option value={2}>통검</option>
                    <option value={3}>플러스</option>
                  </select>
              </div>

             <div className="flex items-center gap-2"
               style={{
                  display:
                    keywordLimit && keywordLimit>=1 ? '' : 'none',
                }}
             >
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"

                placeholder={isKeyword ? "시크릿 키워드1":"시크릿 랜딩 1"}
                value={isKeyword ? secretKey1 : secretLandingKey1}
                 onChange={(e) => {
                  isKeyword ? setSecretKey1(e.target.value) : setSecretLandingKey1(e.target.value)
                }
                }
              />
                <select
                style={isKeyword ? {} : { display: 'none' }}

                className="w-[100px] border px-2 py-2 rounded"
                value={sceretKeyLinkType1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSceretKeyLinkType1(val)
                }}
              >
                <option value={0}>미선택</option>
                <option value={1}>쇼검</option>
                <option value={2}>통검</option>
                <option value={3}>플러스</option>
              </select>
            </div>
            <div className="flex items-center gap-2"
               style={{
                  display:
                    keywordLimit && keywordLimit>=2 ? '' : 'none',
                }}
            >
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                placeholder={isKeyword ? "시크릿 키워드2":"시크릿 랜딩2"}
                value={isKeyword ? secretKey2: secretLandingKey2}
                 onChange={(e) => {
                  isKeyword ? setSecretKey2(e.target.value) : setSecretLandingKey2(e.target.value)
                }
                }
              />
             <select
                style={isKeyword ? {} : { display: 'none' }}
                className="w-[100px] border px-2 py-2 rounded"
                value={sceretKeyLinkType2}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSceretKeyLinkType2(val)
                }}
              >
                <option value={0}>미선택</option>
                <option value={1}>쇼검</option>
                <option value={2}>통검</option>
                <option value={3}>플러스</option>
              </select>
            </div>
            <div className="flex items-center gap-2"
               style={{
                  display:
                    keywordLimit && keywordLimit>=3 ? '' : 'none',
                }}
            >
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                placeholder={isKeyword ? "시크릿 키워드3":"시크릿 랜딩3"}
                value={isKeyword ? secretKey3 : secretLandingKey3}
                onChange={(e) => {
                  isKeyword ? setSecretKey3(e.target.value) : setSecretLandingKey3(e.target.value)
                }
                }
              />
               <select
               style={isKeyword ? {} : { display: 'none' }}
                className="w-[100px] border px-2 py-2 rounded"
                value={sceretKeyLinkType3}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSceretKeyLinkType3(val)
                }}
              >
                <option value={0}>미선택</option>
                <option value={1}>쇼검</option>
                <option value={2}>통검</option>
                <option value={3}>플러스</option>
              </select>
            </div>

            <div className="flex items-center gap-2"
              style={{
                  display:
                    keywordLimit && keywordLimit>=4 ? '' : 'none',
                }}
            >
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                placeholder={isKeyword ? "시크릿 키워드4":"시크릿 랜딩4"}
                value={isKeyword ? secretKey4 : secretLandingKey4}
                 onChange={(e) => {
                  isKeyword ? setSecretKey4(e.target.value) : setSecretLandingKey4(e.target.value)
                }
                }
              />
               <select
               style={isKeyword ? {} : { display: 'none' }}
                className="w-[100px] border px-2 py-2 rounded"
                value={sceretKeyLinkType4}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSceretKeyLinkType4(val)
                }}
              >
                <option value={0}>미선택</option>
                <option value={1}>쇼검</option>
                <option value={2}>통검</option>
                <option value={3}>플러스</option>
              </select>
            </div>



            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelModal}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={() => handleConfirmModal(selectedModalSlot!.seq)}
                className="px-4 py-2 rounded text-white bg-[#282828] hover:bg-[#141414]"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
            </div>

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
