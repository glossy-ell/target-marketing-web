'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import axios from 'axios';

interface Summary {
  total: number;
  active: number;
  error: number;
  waiting: number;
  closingToday: number;
}

interface SlotSummaryCardsProps {
  slotSearchType: number;
  setSlotSearchType: Dispatch<SetStateAction<number>>;
}



export default function SlotSummaryCards({
    slotSearchType,
    setSlotSearchType,
  }: SlotSummaryCardsProps) {

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get('/api/slots/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('통계 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <div className="p-6 text-center text-lg animate-pulse text-gray-500">
    🔄 요약정보 불러오는 중...
  </div>;
  if (!summary) return <div className="p-4 text-red-500">데이터 없음</div>;

  return (
    <div className="flex mt-[30px] rounded-lg bg-white shadow-[rgba(0,0,0,0.07)_4px_4px_15px_0px] sm:p-[10px] sm:gap-8">
      {[
        { label: '전체', value: summary.total, desc: '보유한 전체 슬롯 개수' },
        { label: '정상', value: summary.active, desc: '정상 구동중인 슬롯 개수' },
        { label: '오류', value: summary.error, desc: '수정이 필요한 슬롯 개수' },
        { label: '대기', value: summary.waiting, desc: '정보 수집 대기중인 슬롯 개수' },
        { label: '마감예정', value: summary.closingToday, desc: '오늘 마감예정인 슬롯 개수' },
      ].map((item, idx) => (
        <div
          key={idx}
          className="flex-1 rounded-[12px] bg-white cursor-pointer cursor-pointer hover:shadow-md hover:scale-[1.02] p-4 transition-transform duration-200"
        >
          <div onClick={() => setSlotSearchType(idx)}>
            <div className="text-lg font-semibold mb-1">{item.label}</div>
            <div className="text-xs sm:text-sm text-gray-500">{item.desc}</div>
            <div className="text-lg sm:text-xl font-bold mt-3">{item.value}개</div>
          </div>
        </div>
      ))}
    </div>
  );
}  