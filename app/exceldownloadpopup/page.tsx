'use client';

import SlotRankingModal from '@/components/modals/SlotRankingModal';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ko } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import ReactDatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import * as XLSX from 'xlsx-js-style';


interface Slot {
  answerTagList: string;
  productPrice: number;
  storeName: string;
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
  rank: number;
  memo: string;
  impressions: number;
  sortation : number;
  secretKey1 : string;
  secretKey2 : string;
  secretKey3 : string;
  secretKey4 : string;
  landingUrl : string,
  secretLandingKey1 : string;
  secretLandingKey2 : string;
  secretLandingKey3 : string;
  secretLandingKey4 : string;
  status: boolean;
  singleLink: string;
  sceretKeyLinkType1: number|null;
  sceretKeyLinkType2: number|null;
  sceretKeyLinkType3: number|null;
  sceretKeyLinkType4: number|null;
  comparePriceLowestPrice: number;
  comparePriceURL: string;
  comparePriceSalePlaceCount:number;
  extraTime : number;
  keywordLimit: number;
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

  const [time,setTime] = useState<number>(1);
  const [duration, setDuration] = useState<string>("1");

  const [targetSlot,setTargetSlot] = useState<Slot[]>([]); //키워드
  const [targetLandingSlot,setTargetLandingSlot] = useState<Slot[]>([]); //키워드

  const [menu,setMenu] = useState<number>(0);

  const [extraTime,setExtraTime] = useState<number>(0);

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
    window.opener?.postMessage('popup-ready', window.origin);
  const handleMessage = (event: MessageEvent) => {

    if (event.origin !== window.location.origin) return;
    const { targetSlot,selectedIds } = event.data;



    // const filteredSlots = targetSlot.filter((slot:Slot) => slot.sortation === 1 || slot.sortation === 2);
    const filteredSlots = targetSlot;
    if(!filteredSlots){
      setLoading(false);
      return;
    }
    setSlots(filteredSlots);


    const targetKeywordSlot = filteredSlots
    .filter((slot:Slot)=> slot.sortation === 1)
    .sort((a:Slot, b:Slot) => b.seq - a.seq); // 역순

    const targetLandingSlot = filteredSlots
    .filter((slot:Slot) => slot.sortation === 2)
    .sort((a:Slot, b:Slot) => b.seq - a.seq); // 역순

    const selectedKeywordIds = targetKeywordSlot.map((slot:Slot)=> slot.seq);
    const selectedLandingIds = targetLandingSlot.map((slot:Slot) => slot.seq);

    setTargetSlot(targetKeywordSlot);
    setTargetLandingSlot(targetLandingSlot);

    setSelectedIds(selectedKeywordIds);
    setSelectedLandingIds(selectedLandingIds);

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





    const changeTime= (value : number, extraTime:number = 0) => {
        if(value>10){
          alert("배수는 10을 초과할 수 없습니다.");
          return;
        }
        setTime(value);
        alert(`${value+extraTime}배수 설정되었습니다`);
        return;
    };

    const headerMapKeyword: Record<string, string> = {
      "상점명": `상점 명\n(공백 포함 최대 10자까지 노출)\n※ 다음 단어 포함 시 소재 비활성화: 등상품, 위상품, 구매, !, ~, #, 펼치기, 찜하기, 상세, 장바구니, 사러가기클릭, 등클릭, 번째클릭, 스토어클릭, 상품클릭, 클릭+찜`,
      "랜딩 URL": "랜딩 URL\n아래 6가지 중 택 1\n\n1. https://naver.com\n\n2. https://m.naver.com\n\n3. https://msearch.shopping.naver.com\n\n4. https://search.shopping.naver.com/home\n\n5. https://search.shopping.naver.com/ns\n\n6. https://app.shopping.naver.com/bridge",
      "시작 날짜": "시작 날짜\nYYYY-MM-DD",
      "종료 날짜": "종료 날짜\nYYYY-MM-DD",
      '목표 트래픽 수': "목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)",
      "아웃랜딩 여부": "아웃랜딩 여부\n\"Y\" 만 입력",
      "검색어": "검색어\n유저가 검색할 키워드를 입력해주세요.",
      "정답 태그 목록": "정답 태그 목록\n유저가 눌러야 하는 상품 페이지의 관련 태그를 모두 입력해주세요.",
      "상품 이미지 URL": "상품 이미지 URL\n유저가 눌러야 하는 상품의 대표 이미지 링크를 입력해주세요. \n검색 결과에 노출되는 이미지와 동일해야 해요.",
      "상품 가격": "상품 가격\n눌러야 하는 상품의 가격을 똑같이 입력해주세요.\n검색 결과에 노출되는 가격과 동일해야 해요.",
      "상품 ID": "상품 ID\n상품 상세 페이지의 ID를 입력해주세요.",
      "상품 URL": "상품 URL\n상품 상세 페이지의 URL를 입력해주세요.",
    };

    const headerMapKeywordMulti: Record<string, string> = {
      '상점명': `상점 명\n(공백 포함 최대 10자까지 노출)\n※ 다음 단어 포함 시 소재 비활성화: 등상품, 위상품, 구매, !, ~, #, 펼치기, 찜하기, 상세, 장바구니, 사러가기클릭, 등클릭, 번째클릭, 스토어클릭, 상품클릭, 클릭+찜`,
      '랜딩 URL': "랜딩 URL\n아래 6가지 중 택 1\n\n1. https://naver.com\n\n2. https://m.naver.com\n\n3. https://msearch.shopping.naver.com\n\n4. https://search.shopping.naver.com/home\n\n5. https://search.shopping.naver.com/ns\n\n6. https://app.shopping.naver.com/bridge",
      '시작 날짜': "시작 날짜\nYYYY-MM-DD",
      '종료 날짜': "종료 날짜\nYYYY-MM-DD",
      '목표 트래픽 수': "목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)",
      '아웃랜딩 여부': "아웃랜딩 여부\n\"Y\" 만 입력",
      "가격 비교 최저가": "가격 비교 최저가\n가격 비교 최저가를 입력해주세요. 상품 가격이 아니에요",
      "가격 비교 이미지": "가격 비교 이미지\n가격 비교 대표 상품 이미지 URL을 입력해주세요",
      "가격 비교 판매처 수": "가격 비교 판매처 수\n가격 비교 판매처 수를 입력해주세요",
      "상품 가격": "상품 가격\n상품 가격을 입력해주세요",
      "상품 이미지 URL": "상품 이미지\n상품 이미지를 입력해주세요",
      "검색어": "검색어\n검색어를 입력해주세요. 검색 후 랜딩되는 페이지에 상품이 보이지 않으면 소재가 종료될 수 있어요.",
      "정답 태그 목록": "정답 태그 목록\n정답 태그 목록을 입력해주세요",
    };

    const headerMapLanding: Record<string, string> = {
      '상점명': '상점명\n공백 포함 최대 10자까지 노출',
      '랜딩 URL': '랜딩 URL\n상품이 검색된 페이지 혹은 상품이 보이는 페이지를 세팅해주세요.',
      '시작 날짜': '시작 날짜\nYYYY-MM-DD',
      '종료 날짜': '종료 날짜\nYYYY-MM-DD',
      '목표 트래픽 수': '목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)',
      '아웃랜딩 여부': '아웃랜딩 여부\n"Y" 만 입력',
      '정답 태그 목록': '정답 태그 목록\n유저가 눌러야 하는 상품 페이지의 관련 태그를 모두 입력해주세요.',
      '상품 이미지 URL': '상품 이미지 URL\n유저가 눌러야 하는 상품의 대표 이미지 링크를 입력해주세요. \n검색 결과에 노출되는 이미지와 동일해야 해요.',
      '상품 가격': '상품 가격\n눌러야 하는 상품의 가격을 똑같이 입력해주세요.\n검색 결과에 노출되는 가격과 동일해야 해요.',
      '상품 ID': '상품 ID\n상품 상세 페이지의 ID를 입력해주세요.',
      '상품 URL': '상품 URL\n상품 상세 페이지의 URL를 입력해주세요.',
    };


    const headerMapLandingMulti: Record<string, string> = {
      '상점명': '상점명\n공백 포함 최대 10자까지 노출',
      '랜딩 URL': '랜딩 URL\n상품이 검색된 페이지 혹은 상품이 보이는 페이지를 세팅해주세요.',
      '시작 날짜': '시작 날짜\nYYYY-MM-DD',
      '종료 날짜': '종료 날짜\nYYYY-MM-DD',
      '목표 트래픽 수': '목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)',
      '아웃랜딩 여부': '아웃랜딩 여부\n"Y" 만 입력',
      '가격 비교 최저가': '가격 비교 최저가\n가격 비교 최저가를 입력해주세요. 상품 가격이 아니에요',
      '가격 비교 이미지': '가격 비교 이미지\n가격 비교 대표 상품 이미지 URL을 입력해주세요',
      '가격 비교 판매처 수': '가격 비교 판매처 수\n가격 비교 판매처 수를 입력해주세요',
      '상품 가격': '상품 가격\n눌러야 하는 상품의 가격을 똑같이 입력해주세요.\n검색 결과에 노출되는 가격과 동일해야 해요.',
      '상품 이미지 URL': '상품 이미지 URL\n유저가 눌러야 하는 상품의 대표 이미지 링크를 입력해주세요. \n검색 결과에 노출되는 이미지와 동일해야 해요.',
      '정답 태그 목록': '정답 태그 목록\n유저가 눌러야 하는 상품 페이지의 관련 태그를 모두 입력해주세요.',
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
          '상점명': slot.storeName,
          '상품 URL': slot.singleLink ?? '',
          '시작 날짜': slotStartDate,
          '종료 날짜': slotEndDate,
          '상품 ID': slot.productId ?? '',
          '상품 이미지 URL': slot.thumbnail ?? '',
          '상품 가격': slot.productPrice,
          '정답 태그 목록': slot.answerTagList,
          '아웃랜딩 여부' : 'Y',
          '목표 트래픽 수' : slot.extraTime == 1 ? 15:10,
        };

        if ((!slot.secretKey1 && !slot.secretKey2 && !slot.secretKey3 && !slot.secretKey4) || ( customMode == 1 && slot.sortation  !=1 )) {
          const row: Record<string, any> = {
            ...baseRow,
            '검색어': '',
            '목표 트래픽 수': extraTime ==1 ? 15:10,
          };

          for (let i = 0; i < time; i++) {
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeyword)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
        } else {
          if(slot.secretKey1){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey1,
              '랜딩 URL': slot.sceretKeyLinkType1==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType1== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType1 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeyword)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
           if(slot.secretKey2){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey2,
              '랜딩 URL': slot.sceretKeyLinkType2==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType2== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType2 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeyword)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

           if(slot.secretKey3){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey3,
              '랜딩 URL': slot.sceretKeyLinkType3==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType3== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType3 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeyword)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

           if(slot.secretKey4){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey4,
              '랜딩 URL': slot.sceretKeyLinkType4==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType4== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType4 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeyword)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
        }
      });
        return result;
    };

    const convertSlotsToExcelDataMulti = (slots: Slot[], customMode: number = 0) => {
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
          '상점명': slot.storeName,
          '상품 URL': slot.singleLink ?? '',
          '시작 날짜': slotStartDate,
          '종료 날짜': slotEndDate,
          '상품 이미지 URL': slot.thumbnail ?? '',
          '상품 가격': slot.productPrice,
          '정답 태그 목록': slot.answerTagList,
          '가격 비교 최저가':slot.comparePriceLowestPrice?? '',
          '가격 비교 이미지':slot.comparePriceURL??'',
          '가격 비교 판매처 수': slot.comparePriceSalePlaceCount??'',
          '아웃랜딩 여부' : 'Y',
          '목표 트래픽 수' : slot.extraTime == 1 ? 15:10,
        };

        if ((!slot.secretKey1 && !slot.secretKey2 && !slot.secretKey3 && !slot.secretKey4) || ( customMode == 1 && slot.sortation  !=1 )) {
          const row: Record<string, any> = {
            ...baseRow,
            '검색어': '',
            '목표 트래픽 수': extraTime ==1 ? 15:10,
          };

          for (let i = 0; i < time; i++) {
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeywordMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
        } else {
          if(slot.secretKey1){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey1,
              '랜딩 URL': slot.sceretKeyLinkType1==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType1== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType1 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeywordMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
           if(slot.secretKey2){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey2,
              '랜딩 URL': slot.sceretKeyLinkType2==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType2== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType2 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeywordMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

           if(slot.secretKey3){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey3,
              '랜딩 URL': slot.sceretKeyLinkType3==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType3== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType3 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeywordMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

           if(slot.secretKey4){
            const row: Record<string, any> = {
              ...baseRow,
              '검색어': slot.secretKey4,
              '랜딩 URL': slot.sceretKeyLinkType4==  1 ?'https://search.shopping.naver.com/home': slot.sceretKeyLinkType4== 2? 'https://m.naver.com':
              slot.sceretKeyLinkType4 ==3 ? 'https://search.shopping.naver.com/ns':'',
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapKeywordMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

        }
      });
        return result;
    };

    const convertSlotsToExcelDataLanding = (slots: Slot[], customMode:number = 0) => {
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
          '상점명': slot.storeName,
          '상품 URL': slot.singleLink ?? '',
          '시작 날짜': slotStartDate,
          '종료 날짜': slotEndDate,
          '상품 ID': slot.productId ?? '',
          '상품 이미지 URL': slot.thumbnail ?? '',
          '상품 가격': slot.productPrice,
          '정답 태그 목록': slot.answerTagList,
          '아웃랜딩 여부' : 'Y',
          '목표 트래픽 수' : slot.extraTime == 1 ? 15:10,
        };


        if((!slot.secretLandingKey1 && !slot.secretLandingKey2 && !slot.secretLandingKey3  && !slot.secretLandingKey4  )|| (customMode ==1 && slot.sortation !=2)){

          const row: Record<string, any> = {
            ...baseRow,
            '목표 트래픽 수': extraTime ==1 ? 15:10,
          };

          for (let i = 0; i < time; i++) {
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLanding)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
        }else{
          if(slot.secretLandingKey1){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey1,
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLanding)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
           if(slot.secretLandingKey2){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey2,
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLanding)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

           if(slot.secretLandingKey3){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey3,
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLanding)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

          if(slot.secretLandingKey4){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey4,
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLanding)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
        }
      });
        return result;
    };

    const convertSlotsToExcelDataLandingMulti = (slots: Slot[], customMode:number = 0) => {
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
          '상점명': slot.storeName,
          '상품 URL': slot.singleLink ?? '',
          '시작 날짜': slotStartDate,
          '종료 날짜': slotEndDate,
          '상품 이미지 URL': slot.thumbnail ?? '',
          '상품 가격': slot.productPrice,
          '정답 태그 목록': slot.answerTagList,
          '가격 비교 최저가':slot.comparePriceLowestPrice?? '',
          '가격 비교 이미지':slot.comparePriceURL??'',
          '가격 비교 판매처 수': slot.comparePriceSalePlaceCount??'',
          '아웃랜딩 여부' : 'Y',
          '목표 트래픽 수' : slot.extraTime == 1 ? 15:10,
        };


        if((!slot.secretLandingKey1 && !slot.secretLandingKey2 && !slot.secretLandingKey3  && !slot.secretLandingKey4  )|| (customMode ==1 && slot.sortation !=2)){
          const row: Record<string, any> = {
            ...baseRow,
            '목표 트래픽 수': extraTime ==1 ? 15:10,
          };
          for (let i = 0; i < time; i++) {
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLandingMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
        }else{
          if(slot.secretLandingKey1){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey1,
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLandingMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
           if(slot.secretLandingKey2){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey2,
            };

            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLandingMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

           if(slot.secretLandingKey3){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey3,
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLandingMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }

          if(slot.secretLandingKey4){
            const row: Record<string, any> = {
              ...baseRow,
              '랜딩 URL': slot.secretLandingKey4,
            };
            const orderedRow: Record<string, any> = {};
            for (const key of Object.keys(headerMapLandingMulti)) {
              orderedRow[key] = row[key] ?? '';
            }
            result.push(orderedRow);
          }
        }
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
        Swal.fire({
          title: '엑셀 옵션을 선택해주세요',
              html: `
              <div style="display: flex; gap: 20px; justify-content: center; flex-direction: column; align-items: center;">
                <div>
                  <label><input type="radio" name="option" value="1"> 키워드</label>
                  <label><input type="radio" name="option" value="2"> 랜딩</label>
                  <label><input type="radio" name="option" value="3"> 사용자 지정</label>
                </div>
                <div style="margin-top: 15px;">
                  <label><input type="checkbox" id="checkbox1">단일</label>
                  <label style="margin-left: 10px;"><input type="checkbox" id="checkbox2">원부</label>
                </div>
              </div>
            `,

          showCancelButton: true,
          confirmButtonText: '확인',
          cancelButtonText: '취소',
          preConfirm: () => {
                const selected = document.querySelector<HTMLInputElement>('input[name="option"]:checked');
                if (!selected) {
                  Swal.showValidationMessage('옵션을 선택해주세요.');
                  return;
                }
                 const checkbox1 = document.querySelector<HTMLInputElement>('#checkbox1');
                const checkbox2 = document.querySelector<HTMLInputElement>('#checkbox2');
                if (!checkbox1?.checked && !checkbox2?.checked) {
                  Swal.showValidationMessage('단일/원부 옵션을 선택해주세요.');
                  return false;
                }

              return {
                 selectedOption: selected.value,
                 isSingle: checkbox1?.checked,
                 isMulti: checkbox2?.checked,
              };
          }
        }).then((result) => { // 확인시


        if (result.isConfirmed) {
          if(result.value.selectedOption =="1") {// 키워드
            if (targetSlot.length != 0) {

              const singleSlots = targetSlot.filter(
                slot => slot.productLink === null || slot.productLink.trim() === ""
              );

              const multiSlots = targetSlot.filter(
                slot => slot.productLink !== null && slot.productLink.trim() !== ""
              );


              const keywordData = convertSlotsToExcelData(singleSlots);
              const keywordDataMulti = convertSlotsToExcelDataMulti(multiSlots);

              const keywordHeaders = Object.entries(headerMapKeyword);

              const keywordHeadersMulit = Object.entries(headerMapKeywordMulti);

              // ✅ 헤더에 \r\n이 아닌 \n 그대로 유지 (스타일 적용을 위해)
              if(result.value.isSingle){
                if(singleSlots.length !=0){
                  const keywordSheetData = [
                    keywordHeaders.map(([_, desc]) => desc),
                    ...keywordData.map(row => keywordHeaders.map(([key]) => row[key] ?? ''))
                  ];

                  const keywordWorkSheet = XLSX.utils.aoa_to_sheet(keywordSheetData);

                  // ✅ 헤더 셀에 wrapText 스타일 적용
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
                        const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx }); // r: 1부터 시작
                        const cell = keywordWorkSheet[cellAddress];
                        if (cell) {
                          cell.s = {
                            alignment: {
                              horizontal: "left", // 왼쪽 정렬
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
                    { wch: 42 },   // 상점명
                    { wch: 60 },   // 랜딩URL
                    { wch: 60 },   // 시작일
                    { wch: 60 },   // 종료일
                    { wch: 60 },   // 목표 트래픽
                    { wch: 60 },   // 아웃랜딩 여부
                    { wch: 60 },   // 검색어
                    { wch: 60 },   // 정답태그
                    { wch: 60 },   // 상품이미지
                    { wch: 60 },   // 상품 가격
                    { wch: 60 },   // 상품 ID
                    { wch: 60 },   // 상품 URL
                  ];

                  const keywordWorkbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(keywordWorkbook, keywordWorkSheet, 'my_sheet');
                  XLSX.writeFile(keywordWorkbook, '슬롯_키워드_엑셀.xlsx');
                }else{
                 if(multiSlots.length ==0 || !result.value.isMulti){

                      alert("출력할 데이터가 없습니다.");
                      return;
                    }
                }
              }


              if(result.value.isMulti){
                if(multiSlots.length !=0){
                  const keywordSheetData = [
                  keywordHeadersMulit.map(([_, desc]) => desc),
                  ...keywordDataMulti.map(row => keywordHeadersMulit.map(([key]) => row[key] ?? ''))
                  ];

                  const keywordWorkSheet = XLSX.utils.aoa_to_sheet(keywordSheetData);

                  // ✅ 헤더 셀에 wrapText 스타일 적용
                  keywordHeadersMulit.forEach((_, colIdx) => {
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

                    keywordDataMulti.forEach((_, rowIdx) => {
                      keywordHeadersMulit.forEach((_, colIdx) => {
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
                    { wch: 42 },   // 상점명
                    { wch: 60 },   // 랜딩URL
                    { wch: 60 },   // 시작일
                    { wch: 60 },   // 종료일
                    { wch: 60 },   // 목표 트래픽
                    { wch: 60 },   // 아웃랜딩 여부
                    { wch: 60 },   // 검색어
                    { wch: 60 },   // 정답태그
                    { wch: 60 },   // 상품이미지
                    { wch: 60 },   // 상품 가격
                    { wch: 60 },   // 상품 ID
                    { wch: 60 },   // 상품 URL
                    { wch: 60 },
                  ];

                  const keywordWorkbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(keywordWorkbook, keywordWorkSheet, 'my_sheet');
                  XLSX.writeFile(keywordWorkbook, '슬롯_키워드_엑셀_원부.xlsx');
                } else{
                    if(singleSlots.length ==0  || !result.value.isSingle){
                      alert("출력할 데이터가 없습니다.");
                      return;
                    }
                }
              }

            }else{
                  alert("출력할 데이터가 없습니다.");
                  return;
                }
         }
          else if(result.value.selectedOption =="2") {// 랜딩
            if (targetLandingSlot.length != 0) {

                const singleSlots = targetLandingSlot.filter(
                  slot => slot.productLink === null || slot.productLink.trim() === ""
                );

                const multiSlots = targetLandingSlot.filter(
                  slot => slot.productLink !== null && slot.productLink.trim() !== ""
                );

                const landingData = convertSlotsToExcelDataLanding(singleSlots);
                const landingDataMulti = convertSlotsToExcelDataLandingMulti(multiSlots);

                const landingHeaders = Object.entries(headerMapLanding);
                const landingHeadersMulti = Object.entries(headerMapLandingMulti);
                if(result.value.isSingle){
                  if(singleSlots.length !=0){
                    // ✅ 헤더에 \r\n 제거하고 \n 그대로 유지
                    const landingSheetData = [
                      landingHeaders.map(([_, desc]) => desc),
                      ...landingData.map(row => landingHeaders.map(([key]) => row[key] ?? ''))
                    ];

                    const landingWorksheet = XLSX.utils.aoa_to_sheet(landingSheetData);

                    // ✅ 헤더 셀에 wrapText 스타일 적용
                    landingHeaders.forEach((_, colIdx) => {
                      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                      const cell = landingWorksheet[cellAddress];
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

                    landingData.forEach((_, rowIdx) => {
                      landingHeaders.forEach((_, colIdx) => {
                        const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
                        const cell = landingWorksheet[cellAddress];
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

                    landingWorksheet['!cols'] = [
                      { wch: 42 },   // 상점명
                      { wch: 60 },   // 랜딩URL
                      { wch: 60 },   // 시작일
                      { wch: 60 },   // 종료일
                      { wch: 60 },   // 목표 트래픽
                      { wch: 60 },   // 아웃랜딩 여부
                      { wch: 60 },   // 정답태그
                      { wch: 60 },   // 상품이미지
                      { wch: 60 },   // 상품 가격
                      { wch: 60 },   // 상품 ID
                      { wch: 60 },   // 상품 URL
                      { wch: 60 },   // 검색어
                    ];

                    const landingWorkbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(landingWorkbook, landingWorksheet, 'my_sheet');
                    XLSX.writeFile(landingWorkbook, '슬롯_랜딩_엑셀.xlsx');
                  }else{
                    if(multiSlots.length ==0  || !result.value.isMulti){
                      alert("출력할 데이터가 없습니다.");
                      return;
                    }
                  }
                }

                if(result.value.isMulti){

                  if (multiSlots.length != 0) {
                      // ✅ 헤더에 \r\n 제거하고 \n 그대로 유지
                      const landingSheetDataMulti = [
                        landingHeadersMulti.map(([_, desc]) => desc),
                        ...landingDataMulti.map(row => landingHeadersMulti.map(([key]) => row[key] ?? ''))
                      ];

                      const landingWorksheet = XLSX.utils.aoa_to_sheet(landingSheetDataMulti);

                      // ✅ 헤더 셀에 wrapText 스타일 적용
                      landingHeadersMulti.forEach((_, colIdx) => {
                        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                        const cell = landingWorksheet[cellAddress];
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

                        landingDataMulti.forEach((_, rowIdx) => {
                          landingHeadersMulti.forEach((_, colIdx) => {
                            const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
                            const cell = landingWorksheet[cellAddress];
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

                      landingWorksheet['!cols'] = [
                        { wch: 42 },   // 상점명
                        { wch: 60 },   // 랜딩URL
                        { wch: 60 },   // 시작일
                        { wch: 60 },   // 종료일
                        { wch: 60 },   // 목표 트래픽
                        { wch: 60 },   // 아웃랜딩 여부
                        { wch: 60 },   // 정답태그
                        { wch: 60 },   // 상품이미지
                        { wch: 60 },   // 상품 가격
                        { wch: 60 },   // 상품 ID
                        { wch: 60 },   // 상품 URL
                        { wch: 60 },   // 검색어
                      ];

                      const landingWorkbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(landingWorkbook, landingWorksheet, 'my_sheet');
                      XLSX.writeFile(landingWorkbook, '슬롯_랜딩_엑셀_원부.xlsx');
                  }else{
                    if(singleSlots.length ==0  || !result.value.isSingle){
                      alert("출력할 데이터가 없습니다.");
                      return;
                    }
                  }
                }


            }else{
                  alert("출력할 데이터가 없습니다.");
                  return;
                }

          }
        else if(result.value.selectedOption =="3") {// 사용자지정

            if(targetSlot.length == 0 && targetLandingSlot.length == 0){
              alert("출력할 데이터가 없습니다.");
              return;
            }
            if (targetSlot.length != 0) {

              const singleSlots = targetSlot.filter(
                slot => slot.productLink === null || slot.productLink.trim() === ""
              );

              const multiSlots = targetSlot.filter(
                slot => slot.productLink !== null && slot.productLink.trim() !== ""
              );


              const keywordData = convertSlotsToExcelData(singleSlots);
              const keywordDataMulti = convertSlotsToExcelDataMulti(multiSlots);

              const keywordHeaders = Object.entries(headerMapKeyword);
              const keywordHeadersMulit = Object.entries(headerMapKeywordMulti);

              // ✅ 헤더에 \r\n이 아닌 \n 그대로 유지 (스타일 적용을 위해)
              if(result.value.isSingle){
                if(singleSlots.length !=0){
                const keywordSheetData = [
                  keywordHeaders.map(([_, desc]) => desc),
                  ...keywordData.map(row => keywordHeaders.map(([key]) => row[key] ?? ''))
                ];

                const keywordWorkSheet = XLSX.utils.aoa_to_sheet(keywordSheetData);

                // ✅ 헤더 셀에 wrapText 스타일 적용
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
                        alignment: { horizontal: "left", vertical: "top", wrapText: true },
                        font: { name: "맑은 고딕", sz: 11 }
                      };
                    }
                  });
                });

                keywordWorkSheet['!cols'] = [
                  { wch: 42 },   // 상점명
                  { wch: 60 },   // 랜딩URL
                  { wch: 60 },   // 시작일
                  { wch: 60 },   // 종료일
                  { wch: 60 },   // 목표 트래픽
                  { wch: 60 },   // 아웃랜딩 여부
                  { wch: 60 },   // 검색어
                  { wch: 60 },   // 정답태그
                  { wch: 60 },   // 상품이미지
                  { wch: 60 },   // 상품 가격
                  { wch: 60 },   // 상품 ID
                  { wch: 60 },   // 상품 URL
                  { wch: 60 },
                ];

                const keywordWorkbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(keywordWorkbook, keywordWorkSheet, 'my_sheet');
                XLSX.writeFile(keywordWorkbook, '슬롯_키워드_엑셀.xlsx');
                }
              }
              if(result.value.isMulti){
                if(multiSlots.length !=0){
                  const keywordSheetData = [
                  keywordHeadersMulit.map(([_, desc]) => desc),
                  ...keywordDataMulti.map(row => keywordHeadersMulit.map(([key]) => row[key] ?? ''))
                ];

                const keywordWorkSheet = XLSX.utils.aoa_to_sheet(keywordSheetData);

                // ✅ 헤더 셀에 wrapText 스타일 적용
                keywordHeadersMulit.forEach((_, colIdx) => {
                  const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                  const cell = keywordWorkSheet[cellAddress];
                  if (cell) {
                    cell.s = {
                      alignment: { wrapText: true, vertical: "top" },
                      font: { name: "맑은 고딕", sz: 11 }
                    };
                  }
                });
                keywordDataMulti.forEach((_, rowIdx) => {
                  keywordHeadersMulit.forEach((_, colIdx) => {
                    const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
                    const cell = keywordWorkSheet[cellAddress];
                    if (cell) {
                      cell.s = {
                        alignment: { horizontal: "left", vertical: "top", wrapText: true },
                        font: { name: "맑은 고딕", sz: 11 }
                      };
                    }
                  });
                });

                keywordWorkSheet['!cols'] = [
                  { wch: 42 },   // 상점명
                  { wch: 60 },   // 랜딩URL
                  { wch: 60 },   // 시작일
                  { wch: 60 },   // 종료일
                  { wch: 60 },   // 목표 트래픽
                  { wch: 60 },   // 아웃랜딩 여부
                  { wch: 60 },   // 검색어
                  { wch: 60 },   // 정답태그
                  { wch: 60 },   // 상품이미지
                  { wch: 60 },   // 상품 가격
                  { wch: 60 },   // 상품 ID
                  { wch: 60 },   // 상품 URL
                  { wch: 60 },
                ];

                const keywordWorkbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(keywordWorkbook, keywordWorkSheet, 'my_sheet');
                XLSX.writeFile(keywordWorkbook, '슬롯_키워드_엑셀_원부.xlsx');
                }
              }
            }
            if (targetLandingSlot.length != 0) {

                const singleSlots = targetLandingSlot.filter(
                  slot => slot.productLink === null || slot.productLink.trim() === ""
                );
                const multiSlots = targetLandingSlot.filter(
                  slot => slot.productLink !== null && slot.productLink.trim() !== ""
                );


                const landingData = convertSlotsToExcelDataLanding(singleSlots);
                const landingDataMulti = convertSlotsToExcelDataLandingMulti(multiSlots);

                const landingHeaders = Object.entries(headerMapLanding);
                const landingHeadersMulti = Object.entries(headerMapLandingMulti);
                if(result.value.isSingle){
                  if(singleSlots.length !=0){
                    // ✅ 헤더에 \r\n 제거하고 \n 그대로 유지
                    const landingSheetData = [
                      landingHeaders.map(([_, desc]) => desc),
                      ...landingData.map(row => landingHeaders.map(([key]) => row[key] ?? ''))
                    ];

                    const landingWorksheet = XLSX.utils.aoa_to_sheet(landingSheetData);

                    // ✅ 헤더 셀에 wrapText 스타일 적용
                    landingHeaders.forEach((_, colIdx) => {
                      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                      const cell = landingWorksheet[cellAddress];
                      if (cell) {
                        cell.s = {
                          alignment: { wrapText: true, vertical: "top" },
                          font: { name: "맑은 고딕", sz: 11 }
                        };
                      }
                    });
                    landingData.forEach((_, rowIdx) => {
                      landingHeaders.forEach((_, colIdx) => {
                        const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
                        const cell = landingWorksheet[cellAddress];
                        if (cell) {
                          cell.s = {
                            alignment: { horizontal: "left", vertical: "top", wrapText: true },
                            font: { name: "맑은 고딕", sz: 11 }
                          };
                        }
                      });
                    });

                    landingWorksheet['!cols'] = [
                      { wch: 42 },   // 상점명
                      { wch: 60 },   // 랜딩URL
                      { wch: 60 },   // 시작일
                      { wch: 60 },   // 종료일
                      { wch: 60 },   // 목표 트래픽
                      { wch: 60 },   // 아웃랜딩 여부
                      { wch: 60 },   // 정답태그
                      { wch: 60 },   // 상품이미지
                      { wch: 60 },   // 상품 가격
                      { wch: 60 },   // 상품 ID
                      { wch: 60 },   // 상품 URL
                      { wch: 60 },   // 검색어
                    ];

                    const landingWorkbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(landingWorkbook, landingWorksheet, 'my_sheet');
                    XLSX.writeFile(landingWorkbook, '슬롯_랜딩_엑셀.xlsx');
                  }
                }
                if(result.value.isMulti){
                  if (multiSlots.length != 0) {
                      // ✅ 헤더에 \r\n 제거하고 \n 그대로 유지
                      const landingSheetDataMulti = [
                        landingHeadersMulti.map(([_, desc]) => desc),
                        ...landingDataMulti.map(row => landingHeadersMulti.map(([key]) => row[key] ?? ''))
                      ];

                      const landingWorksheet = XLSX.utils.aoa_to_sheet(landingSheetDataMulti);

                      // ✅ 헤더 셀에 wrapText 스타일 적용
                      landingHeadersMulti.forEach((_, colIdx) => {
                        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                        const cell = landingWorksheet[cellAddress];
                        if (cell) {
                          cell.s = {
                            alignment: { wrapText: true, vertical: "top" },
                            font: { name: "맑은 고딕", sz: 11 }
                          };
                        }
                      });
                      landingDataMulti.forEach((_, rowIdx) => {
                        landingHeadersMulti.forEach((_, colIdx) => {
                          const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
                          const cell = landingWorksheet[cellAddress];
                          if (cell) {
                            cell.s = {
                              alignment: { horizontal: "left", vertical: "top", wrapText: true },
                              font: { name: "맑은 고딕", sz: 11 }
                            };
                          }
                        });
                      });

                      landingWorksheet['!cols'] = [
                        { wch: 42 },   // 상점명
                        { wch: 60 },   // 랜딩URL
                        { wch: 60 },   // 시작일
                        { wch: 60 },   // 종료일
                        { wch: 60 },   // 목표 트래픽
                        { wch: 60 },   // 아웃랜딩 여부
                        { wch: 60 },   // 정답태그
                        { wch: 60 },   // 상품이미지
                        { wch: 60 },   // 상품 가격
                        { wch: 60 },   // 상품 ID
                        { wch: 60 },   // 상품 URL
                        { wch: 60 },   // 검색어
                      ];

                      const landingWorkbook = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(landingWorkbook, landingWorksheet, 'my_sheet');
                      XLSX.writeFile(landingWorkbook, '슬롯_랜딩_엑셀_원부.xlsx');
                  }
                }
            }
        }
        //완료
      }
    });




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
            onClick={()=>{
              changeTime(2)
              setExtraTime(0)
            }}>
            2배수
          </button>
          <button
            className="bg-[#282828] text-white px-4 py-2 rounded hover:bg-[#141414] text-sm whitespace-nowrap"
            onClick={()=>{
              changeTime(3)
              setExtraTime(0)
            }}>
            3배수
          </button>
          <button
            className="bg-[#282828] text-white px-4 py-2 rounded hover:bg-[#141414] text-sm whitespace-nowrap"
            onClick={()=>{
              changeTime(4)
              setExtraTime(0);
            }}>
            4배수
          </button>
          <button
            className="bg-[#282828] text-white px-4 py-2 rounded hover:bg-[#141414] text-sm whitespace-nowrap"
            onClick={()=>{
              changeTime(4,2)
              setExtraTime(1);
            }}
          >
            6배수
          </button>

          {/* <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="배수를 입력하세요"
              className="bg-white text-black border text-xs border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              value={inputValue}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자이고 10 이하만 허용
                if (Number(value) <= 10) {
                  setInputValue(value);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  changeTime(Number((e.target as HTMLInputElement).value));셀
                }
              }}
              max={10}
            />
            <button
              onClick={() => changeTime(Number(inputValue))}
              className="bg-[#282828] text-white px-4 py-2 rounded hover:bg-[#141414] text-sm whitespace-nowrap"
            >
              확인
            </button>
          </div> */}

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
                    selected={startDate ? new Date(startDate.split(' ')[0]) : new Date(Date.now() + 24 * 60 * 60 * 1000)}  // 현재 startDate 값 반영
                    onChange={(date: Date | null) => {
                      if (date) {
                        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                          .toString()
                          .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} 00:00:00.000`;
                        // if(new Date(formattedDate)> (isNaN(new Date(endDate).getTime()) ? new Date() : new Date(endDate)))
                        //   alert("시작일은 종료일보다 클 수 없습니다.");
                        // else
                          setStartDate(formattedDate);
                      }
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="border px-1 py-1 rounded text-lg font-semibold text-[#282828] w-[150px]"
                    locale={ko}
                  />
                  <ReactDatePicker
                    selected={endDate ? new Date(endDate.split(' ')[0]) : new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    onChange={(date: Date | null) => {
                      if (date) {
                        const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
                          .toString()
                          .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} 00:00:00.000`;
                        // if(new Date(formattedDate)< (isNaN(new Date(startDate).getTime()) ? new Date() : new Date(startDate)))
                        //   alert("시작일은 종료일보다 클 수 없습니다.");
                        // else
                          setEndDate(formattedDate);
                      }
                    }}
                    dateFormat="yyyy-MM-dd"
                    className="border px-1 py-1 rounded text-lg font-semibold text-[#282828] w-[150px]"
                    locale={ko}
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
            <div className="overflow-x-auto rounded-lg shadow-md">
                <table className="w-full table-fixed border-collapse border border-gray-300 text-sm text-center">
                <thead className="text-xs bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    <th className="px-5 py-4 border-b border-gray-300">번호</th>

                    {isAdmin && (
                      <th className="px-5 py-4 border-b border-gray-300">총판 ID</th>
                    )}

                    {(isAdmin || isDistributor) && (
                      <th className="px-5 py-4 border-b border-gray-300">대행사 ID</th>
                    )}
                    <th className="px-5 py-4 border-b border-gray-300">구분</th>
                    <th className="px-5 py-4 border-b border-gray-300">상태</th>
                    <th className="px-5 py-4 border-b border-gray-300">사용자 ID</th>

                    <th className="px-5 py-4 border-b border-gray-300">썸네일</th>
                    <th className="px-5 py-4 border-b border-gray-300">키워드</th>
                    <th className="px-5 py-4 border-b border-gray-300">원부 링크</th>
                    <th className="px-5 py-4 border-b border-gray-300">단일 링크</th>
                    <th className="px-5 py-4 border-b border-gray-300">추가등록1</th>
                    <th className="px-5 py-4 border-b border-gray-300">추가등록2</th>
                    <th className="px-5 py-4 border-b border-gray-300">추가등록3</th>
                    <th className="px-5 py-4 border-b border-gray-300">추가등록4</th>
                    <th className="px-5 py-4 border-b border-gray-300">시작일</th>
                    <th className="px-5 py-4 border-b border-gray-300">종료일</th>
                    <th className="px-5 py-4 border-b border-gray-300">메모</th>
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
                        className="hover:bg-gray-100 transition-colors duration-200"
                      >

                        <td className="p-3 border-b border-gray-200">
                          {slot.seq}
                        </td>
                        {isAdmin && (
                          <>
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                              {slot.distributorId || '-'}
                            </td>
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                              {slot.agencyId || '-'}
                            </td>
                          </>
                        )}
                        {isDistributor && !isAdmin && (
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {slot.distributorId || '-'}
                          </td>
                        )}
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            <span className="whitespace-nowrap">
                              {slot.sortation === 1
                                ? "키워드"
                                : slot.sortation === 2
                                ? "랜딩"
                                : "-"}
                            </span>
                          </td>
                        <td className="p-3 border-b border-gray-200 max-w-xs break-words">
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
                                  ? 'text-green-600' : 'text-red-600'}`}
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
                       </td>

                        <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                          {slot.userId}
                        </td>
                        <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                          {slot.thumbnail ? (
                            <img
                              src={slot.thumbnail}
                              alt="썸네일"
                              className="w-16 h-16 object-cover rounded"
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
                                <span className="whitespace-nowrap truncate whitespace-nowrap overflow-hidden">
                                  {slot.keyword || '-'}
                                </span>
                                {typeof slot.rank === 'number' && (
                                  <span
                                    className="text-blue-500 cursor-pointer hover:underline whitespace-nowrap"
                                    onClick={() => setRankingSlotSeq(slot.seq)}
                                  >
                                    (순위: {slot.rank}위)
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </td>
                        <Tooltip.Provider delayDuration={50}>
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
                                    className="text-purple-700 hover:underline truncate inline-block max-w-full cursor-pointer"
                                  >
                                    {slot.productLink}
                                  </a>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px] z-50"
                                    sideOffset={5}
                                  >
                                    {slot.productLink}
                                    <Tooltip.Arrow className="fill-black" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </Tooltip.Provider>
                          <Tooltip.Provider delayDuration={50}>
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
                                    className="text-purple-700 hover:underline truncate inline-block max-w-full cursor-pointer"
                                  >
                                    {slot.singleLink}
                                  </a>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px] z-50"
                                    sideOffset={5}
                                  >
                                    {slot.singleLink}
                                    <Tooltip.Arrow className="fill-black" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </Tooltip.Provider>
                         {(slot.sortation === 1
                          ? [
                              <td key="secretKey1" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretKey1}</td>,
                              <td key="secretKey2" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretKey2}</td>,
                              <td key="secretKey3" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretKey3}</td>,
                              <td key="secretKey4" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretKey4}</td>,
                            ]
                          : slot.sortation=== 2
                          ? [
                              <td key="secretKey1" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretLandingKey1}</td>,
                              <td key="secretKey2" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretLandingKey2}</td>,
                              <td key="secretKey3" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretLandingKey3}</td>,
                              <td key="secretKey4" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden">{slot.secretLandingKey4}</td>,
                            ]
                          : [
                              <td key="secretKey1" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden"></td>,
                              <td key="secretKey2" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden"></td>,
                              <td key="secretKey3" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden"></td>,
                              <td key="secretKey4" className="p-3 border-b border-gray-200 truncate whitespace-nowrap overflow-hidden"></td>,
                            ]
                        )}


                        <td className="p-3 border-b border-gray-200">
                          {
                            formatDate(
                              new Date(
                                Math.max(
                                  Math.min(
                                    new Date(slot.endDate).getTime(),
                                    isNaN(new Date(startDate).getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000).getTime() : new Date(startDate).getTime()
                                  ),
                                  new Date(slot.startDate).getTime()
                                 )
                              )
                            )
                          }
                        </td>
                        <td className="p-3 border-b border-gray-200">
                          {
                             formatDate(
                              new Date(
                                Math.min(
                                  new Date(slot.endDate).getTime(),
                                  isNaN(new Date(endDate).getTime()) ? new Date(Date.now() + 24 * 60 * 60 * 1000).getTime() : new Date(endDate).getTime()
                                )
                              )
                            )
                          }
                        </td>
                        <Tooltip.Provider delayDuration={50}>
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {isEditing ? (
                              <input
                                className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                                value={editedSlot.memo || ''}
                                onChange={(e) => handleInputChange('memo', e.target.value)}
                              />
                            ) : slot.memo ? (
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <span className="whitespace-pre-wrap break-words cursor-pointer line-clamp-2">
                                    {slot.memo}
                                  </span>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    side="top"
                                    className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px]"
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

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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

