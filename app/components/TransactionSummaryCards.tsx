'use client';

import React, { Dispatch, SetStateAction } from 'react';

interface StatsProps {

  totalCount: number;
  totalIssuedCount: number;
  totalRefundCount: number;
  totalCancelCount: number;
  totalSettleCount: number;
  



  searchTotalIssued: boolean;
  searchTotalRefund: boolean;
  searchTotalCancel: boolean;
  searchTotalSettle: boolean
  
  setSearchTotalIssued: Dispatch<SetStateAction<boolean>>;
  setSearchTotalRefund: Dispatch<SetStateAction<boolean>>;
  setSearchTotalCancel: Dispatch<SetStateAction<boolean>>;
  setSearchTotalSettle: Dispatch<SetStateAction<boolean>>;
  
  page : number;
  setPage: Dispatch<SetStateAction<number>>;
}

export default function TransactionSummaryCards({

  totalCount,
  totalIssuedCount,
  totalRefundCount,
  totalCancelCount,
  totalSettleCount,

  searchTotalIssued,
  searchTotalRefund,
  searchTotalCancel,
  searchTotalSettle,
  setSearchTotalIssued,
  setSearchTotalRefund,
  setSearchTotalCancel,
  setSearchTotalSettle,


  page,
  setPage,


}: StatsProps) {
   const stats = [
      {
        label: '전체',
        value: totalCount,
        desc: '전체 로그 개수',
        onClick: () => {
          setSearchTotalIssued(false);
          setSearchTotalRefund(false);
          setSearchTotalCancel(false);
          setSearchTotalSettle(false);
          setPage(1);
        },
      },
      {
        label: '판매',
        value: totalIssuedCount,
        desc: '발급된 총 슬롯 개수',
        onClick: () => {
          setSearchTotalIssued(true);
          setSearchTotalRefund(false);
          setSearchTotalCancel(false);
          setSearchTotalSettle(false);
          setPage(1);
        },
      },
      {
        label: '환불',
        value: totalRefundCount,
        desc: '환불 처리된 슬롯 개수',
        onClick: () => {
          setSearchTotalIssued(false);
          setSearchTotalRefund(true);
          setSearchTotalCancel(false);
          setSearchTotalSettle(false);
          setPage(1);
        },
      },
      {
        label: '철회',
        value: totalCancelCount,
        desc: '철회된 슬롯 개수',
        onClick: () => {
          setSearchTotalIssued(false);
          setSearchTotalRefund(false);
          setSearchTotalCancel(true);
          setSearchTotalSettle(false);
          setPage(1);
        },
      },
    ];


  return (
    <div className="flex mt-[30px] rounded-lg bg-white shadow-[rgba(0,0,0,0.07)_4px_4px_15px_0px] p-[10px] gap-8">
      {stats.map((item, idx) => (
        <div
          key={idx}
          onClick={item.onClick !== undefined ? item.onClick : undefined}
          className={`flex-1 rounded-[12px] bg-white p-4 transition-transform duration-200
          ${item.onClick !== undefined ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
        >
          <div>
            <div className="text-lg font-semibold mb-1">{item.label}</div>
            <div className="text-sm text-gray-500">{item.desc}</div>
          </div>
          <div className="text-xl font-bold mt-3">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
