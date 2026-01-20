'use client';

import { useEffect, useState } from 'react';
import SlotList from '../components/SlotList';
import PageHeader from '../components/common/PageHeader';
import SlotSummaryCards from '@/components/SlotSummaryCards';

export default function SlotManagement() {
  const [slotList, setSlotList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  
  const [slotSearchType,setSlotSearchType] = useState<number>(0);


  return (
    <>
      <PageHeader
        title="슬롯관리"
        description="슬롯을 수정하고 관리할 수 있습니다."
      />
      <SlotSummaryCards 
        slotSearchType={slotSearchType}
        setSlotSearchType={setSlotSearchType}
      />
      <div className="flex-grow z-0 relative min-w-0">
        <SlotList 
            slotSearchType={slotSearchType}
            setSlotSearchType={setSlotSearchType}
        />
      </div>
    </>
  );
}
