'use client';

import { useState } from 'react';
import LogList from '../components/LogList';
import TransactionSummaryCards from '@/components/TransactionSummaryCards';
import PageHeader from '../components/common/PageHeader';

export default function LogManagement() {


  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalIssuedCount, setTotalIssuedCount] = useState<number>(0);
  const [totalRefundCount, setTotalRefundCount] = useState<number>(0);
  const [totalCancelCount, setTotalCancelCount] = useState<number>(0);
  const [totalSettleCount, setTotalSettleCount] = useState<number>(0);

  const [searchTotalIssued, setSearchTotalIssued] = useState<boolean>(false);
  const [searchTotalRefund, setSearchTotalRefund] = useState<boolean>(false);
  const [searchTotalCancel, setSearchTotalCancel] = useState<boolean>(false);
  const [searchTotalSettle, setSearchTotalSettle] = useState<boolean>(false);

  const [page, setPage] = useState(1);



  return (
    <>
      <PageHeader
        title="로그"
        description="로그를 조회할 수 있습니다."
      />
      <TransactionSummaryCards

        totalCount={totalCount}
        totalIssuedCount={totalIssuedCount}
        totalRefundCount={totalRefundCount}
        totalCancelCount={totalCancelCount}
        totalSettleCount={totalSettleCount}
        


        searchTotalIssued={searchTotalIssued}
        searchTotalRefund={searchTotalRefund}
        searchTotalCancel={searchTotalCancel}
        searchTotalSettle={searchTotalSettle}


        setSearchTotalIssued={setSearchTotalIssued}
        setSearchTotalRefund={setSearchTotalRefund}
        setSearchTotalCancel={setSearchTotalCancel}
        setSearchTotalSettle={setSearchTotalSettle}


        page={page}
        setPage={setPage}
      />
      <div className="flex-grow">
        <LogList


          setTotalCount={setTotalCount}
          setTotalIssuedCount={setTotalIssuedCount}
          setTotalRefundCount={setTotalRefundCount}
          setTotalCancelCount={setTotalCancelCount}
          setTotalSettleCount={setTotalSettleCount}



          searchTotalIssued={searchTotalIssued}
          searchTotalRefund={searchTotalRefund}
          searchTotalCancel={searchTotalCancel}
          searchTotalSettle={searchTotalSettle}

          page={page}
          setPage={setPage}
        />
      </div>
    </>
  );
}
