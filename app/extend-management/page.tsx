'use client';

import { useEffect, useState } from 'react';
import ExtendList from '../components/ExtendList';
import PageHeader from '../components/common/PageHeader';
import SlotSummaryCards from '@/components/SlotSummaryCards';

export default function ExtendManagement() {
  const [extendList, setExtendList] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  
  useEffect(() => {
    async function fetchExtends() {
      const res = await fetch(`/api/extend?page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      setExtendList(data.data);
      setTotalPages(data.totalPages);
    }
  
    fetchExtends();
  }, [page]);

  return (
    <>
      <PageHeader
        title="연장관리"
        description="연장요청을 확인 및 관리할 수 있습니다."
      />
      {/* <SlotSummaryCards /> */}
      <div className="flex-grow z-0 relative min-w-0">
        <ExtendList />
      </div>
    </>
  );
}
