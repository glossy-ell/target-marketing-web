'use client';

import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';
import React from 'react';

// URL을 절대 경로로 정규화합니다. 프로토콜이 없으면 https:// 를 붙입니다.
const normalizeUrl = (url?: string | null) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

interface Slot {
  seq: number;
  mid: string | null;
  userId: string;
  agencyId: string;
  distributorId: string;
  keyword: string;
  mainKeyword?: string | null;
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

interface SlotTableProps {
  slots: Slot[];
  isAdmin: boolean;
  isDistributor: boolean;
  selectedIds: number[];
  selectAll: boolean;
  handleSelectAll: () => void;
  handleCheckboxChange: (id: number) => void;
  formatDate: (dateString: string) => string;
  
  // Optional props for editing functionality
  editIndex?: number | null;
  editedSlot?: Partial<Slot>;
  handleInputChange?: (field: any, value: string) => void;
  handleConfirm?: (seq: number) => void;
  handleCancel?: () => void;
  
  // Optional props for actions
  showActions?: boolean;
  setRankingSlotSeq?: (seq: number | null) => void;
  handleEditClick?: (index: number) => void;
  handleSingleDelete?: (seq: number) => void;
  handleSingleExtend?: (seq: number) => void;
  fetchCheckSlot?: (seq: number) => void;
  currentUser?: { id: string; seq: number; role: number; rankingCheckAllow: number } | null;
  rankingLoadingSlotSeq?: number | null;
  
  // Optional props for table customization
  showCheckbox?: boolean;
  showActionColumn?: boolean;
  
  // Optional props for date range filtering (for excel pages)
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

const SlotTable: React.FC<SlotTableProps> = ({
  slots,
  isAdmin,
  isDistributor,
  selectedIds,
  selectAll,
  handleSelectAll,
  handleCheckboxChange,
  formatDate,
  editIndex = null,
  editedSlot = {},
  handleInputChange,
  handleConfirm,
  handleCancel,
  showActions = true,
  setRankingSlotSeq,
  handleEditClick,
  handleSingleDelete,
  handleSingleExtend,
  fetchCheckSlot,
  currentUser,
  rankingLoadingSlotSeq,
  showCheckbox = true,
  showActionColumn = true,
  dateRangeStart,
  dateRangeEnd,
}) => {
  // 날짜 범위에 맞춰 시작일/종료일 계산
  const calculateDisplayDates = (slot: Slot) => {
    const slotStartTime = new Date(slot.startDate).getTime();
    const slotEndTime = new Date(slot.endDate).getTime();
    
    let displayStartTime = slotStartTime;
    let displayEndTime = slotEndTime;
    
    if (dateRangeStart) {
      const rangeStartTime = new Date(dateRangeStart).getTime();
      if (!isNaN(rangeStartTime)) {
        // 시작일은 슬롯 원래 시작일 이전으로 내려가지 않고, 슬롯 종료일보다 커질 수 없음
        displayStartTime = Math.max(slotStartTime, Math.min(slotEndTime, rangeStartTime));
      }
    }
    
    if (dateRangeEnd) {
      const rangeEndTime = new Date(dateRangeEnd).getTime();
      if (!isNaN(rangeEndTime)) {
        // 종료일은 슬롯 원래 종료일보다 커질 수 없고, 표시 시작일보다 작아질 수 없음
        displayEndTime = Math.min(slotEndTime, Math.max(displayStartTime, rangeEndTime));
      }
    } else {
      // 종료일이 없으면 기본값:  슬롯 시작일 다음날
      if(dateRangeStart){
        const tomorrow = new Date(displayStartTime).getTime() + (24 * 60 * 60 * 1000);
        displayEndTime = Math.min(slotEndTime, tomorrow);
      }
    }
    
    return {
      startDate: formatDate(new Date(displayStartTime).toISOString()),
      endDate: formatDate(new Date(displayEndTime).toISOString())
    };
  };

  function isBeforeToday(dateStr?: string): boolean {
    if (!dateStr) return false;

    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setDate(today.getDate());
    today.setHours(0, 0, 0, 0);
    console.log(date, today);
    return date < today;
  }


  return (
    <div className="overflow-x-auto rounded-lg shadow-md">
      <table className="text-xs w-full text-center bg-white rounded-lg overflow-hidden border border-gray-200">
        <thead className="text-xs bg-gray-100 text-gray-700 font-semibold">
          <tr>
            {showCheckbox && (
              <th className="px-5 py-4 border-b border-gray-300">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
              </th>
            )}

            <th className="px-5 py-4 border-b border-gray-300">번호</th>
            <th className="px-5 py-4 border-b border-gray-300">타입</th>
            {isAdmin && (
              <th className="px-5 py-4 border-b border-gray-300">총판 ID</th>
            )}

            {(isAdmin || isDistributor) && (
              <th className="px-5 py-4 border-b border-gray-300">대행 ID</th>
            )}
            <th className="px-5 py-4 border-b border-gray-300">상태</th>
            <th className="px-5 py-4 border-b border-gray-300">클라이언트 ID</th>
            <th className="px-5 py-4 border-b border-gray-300">순위 키워드</th>
            <th className="px-5 py-4 border-b border-gray-300">메인 키워드</th>
            <th className="px-5 py-4 border-b border-gray-300">상품 링크</th>
            <th className="px-5 py-4 border-b border-gray-300">가격비교링크</th>
            <th className="px-5 py-4 border-b border-gray-300">MID</th>
            <th className="px-5 py-4 border-b border-gray-300">시작일</th>
            <th className="px-5 py-4 border-b border-gray-300">종료일</th>
            <th className="px-5 py-4 border-b border-gray-300">메모</th>
            {showActionColumn && (
              <th className="px-5 py-4 border-b border-gray-300">액션</th>
            )}
          </tr>
        </thead>

        <tbody>
          {slots.map((slot, index) => {
            const isEditing = editIndex === index;
            return (
              <tr
                key={slot.seq}
                className="hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap overflow-hidden text-ellipsis"
              >
                {showCheckbox && (
                  <td className="p-3 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(slot.seq)}
                      onChange={() => handleCheckboxChange(slot.seq)}
                    />
                  </td>
                )}
                <td className="p-3 border-b border-gray-200">
                  {slot.seq}
                </td>
                <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                  {'리워드'}
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
                    {slot.agencyId || '-'}
                  </td>
                )}

                <Tooltip.Provider delayDuration={100}>
                  <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <div className="flex justify-center items-center gap-2 cursor-pointer">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              slot.keyword && slot.singleLink && slot.mid && slot.hasRanking
                              ?  'bg-green-500' : 'bg-red-500'
                            }`}
                          ></div>
                          <span
                            className={`${
                              slot.keyword && slot.singleLink && slot.mid && slot.hasRanking
                                ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {
                              slot.keyword && slot.singleLink && slot.mid && slot.hasRanking
                                ? '정상' : '오류'}
                          </span>
                        </div>
                      </Tooltip.Trigger>
                      {!(slot.keyword && slot.singleLink && slot.mid && slot.hasRanking) && (
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[300px]"
                            sideOffset={5}
                          >
                            {(() => {
                              const missingFields = [];
                              if (!slot.keyword) missingFields.push('키워드 누락');
                              if (!slot.singleLink) missingFields.push('상품링크 누락');
                              if (!slot.mid) missingFields.push('MID 누락');
                              
                              if (missingFields.length > 0) {
                                return missingFields.join(', ');
                              }
                              
                              if (!slot.hasRanking) {
                                return '순위 데이터 조회에 실패했습니다.';
                              }
                              
                              if (slot.errMsg) {
                                return slot.errMsg;
                              }
                              return '순위 데이터 조회에 실패했습니다.';
                            })()}
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      )}
                    </Tooltip.Root>
                  </td>
                </Tooltip.Provider>
                <td className="p-3 border-b border-gray-200 max-w-[80px] break-words" style={{ whiteSpace: 'pre-wrap' }}>
                  {slot.userId}
                </td>
                <td className="p-3 border-b border-gray-200 max-w-[120px]">
                  {isEditing && handleInputChange ? (
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
                        {slot.rank != null && setRankingSlotSeq && (
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

                                  const diffTime = todayDate.getTime() - date.getTime();
                                  dateDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                }

                                let rankStr = String(rank);
                                let parts = rankStr.split('>');

                                if (dateDiff === 2 && parts.length > 1) {
                                  parts = parts.slice(parts.length - 2);
                                } else if (dateDiff === 1) {
                                  parts = [parts[parts.length - 1]];
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
                        {slot.rank != null && !setRankingSlotSeq && (
                          <span className="text-blue-500 whitespace-nowrap">
                            {(() => {
                              const rankStr = String(slot.rank);
                              const parts = rankStr.split('>');
                              const lastRank = parts[parts.length - 1];
                              const num = parseInt(lastRank, 10);
                              return num !== 0 ? `${num}위` : "순위권 밖";
                            })()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </td>
                <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                  {isEditing && handleInputChange ? (
                    <input
                      className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                      value={editedSlot.mainKeyword || ''}
                      onChange={(e) => handleInputChange('mainKeyword', e.target.value)}
                    />
                  ) : (
                    slot.mainKeyword || '-'
                  )}
                </td>
                <Tooltip.Provider delayDuration={100}>
                  <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                    {isEditing && handleInputChange ? (
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
                            href={normalizeUrl(slot.singleLink) || '#'}
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

                <Tooltip.Provider delayDuration={100}>
                  <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                    {isEditing && handleInputChange ? (
                      <input
                        className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                        value={editedSlot.comparePriceLink || ''}
                        onChange={(e) =>
                          handleInputChange('comparePriceLink', e.target.value)
                        }
                      />
                    ) : slot.comparePriceLink ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <a
                            href={normalizeUrl(slot.comparePriceLink) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-700 hover:underline truncate inline-block max-w-[100px] cursor-pointer"
                          >
                            {slot.comparePriceLink}
                          </a>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap w-full"
                            sideOffset={5}
                          >
                            {slot.comparePriceLink}
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
                    {isEditing && handleInputChange ? (
                      <input
                        className="bg-white text-black border border-gray-300 px-3 py-1 w-full rounded-md"
                        value={editedSlot.mid || ''}
                        placeholder='가격비교일경우 가격비교MID 입력'
                        onChange={(e) =>
                          handleInputChange('mid', e.target.value)
                        }
                      />
                    ) : slot.mid ? (
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <span className="block max-w-[100px] truncate text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer mx-auto">
                            {slot.mid}
                          </span>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="bg-black text-white p-2 rounded text-xs whitespace-pre-wrap max-w-[200px]"
                            sideOffset={5}
                          >
                            {slot.mid}
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </Tooltip.Provider>

                <td className="p-3 border-b border-gray-200 max-w-[50px]">
                  {dateRangeStart || dateRangeEnd ? calculateDisplayDates(slot).startDate : formatDate(slot.startDate)}
                </td>
                <td className="p-3 border-b border-gray-200 max-w-[50px]">
                  {dateRangeStart || dateRangeEnd ? calculateDisplayDates(slot).endDate : formatDate(slot.endDate)}
                </td>
                <Tooltip.Provider delayDuration={100}>
                  <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                    {isEditing && handleInputChange ? (
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
                {showActionColumn && showActions && (
                  <td className="py-3 px-2 border-b border-gray-200 space-x-1 whitespace-nowrap">
                    {isEditing ? (
                      <>
                        {handleConfirm && (
                          <Button
                            className="bg-[#9760ff] hover:bg-[#651eeb] text-white px-3 py-1 rounded-md"
                            onClick={() => handleConfirm(slot.seq)}
                          >
                            저장
                          </Button>
                        )}
                        {handleCancel && (
                          <Button
                            className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded-md"
                            onClick={handleCancel}
                          >
                            취소
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {fetchCheckSlot && currentUser && currentUser.rankingCheckAllow === 1 && (
                          <Button
                            className="h-9 bg-[#282828] hover:bg-[#141414] text-white px-2 w-[60px] rounded-md text-[12px]"
                            onClick={() => fetchCheckSlot(slot.seq)}
                            disabled={rankingLoadingSlotSeq === slot.seq}
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
                        )}
                        {handleEditClick && (
                          <Button
                            className={`${((currentUser != null && currentUser.role != 0) && isBeforeToday(slot.startDate))
                              ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed'
                              : 'bg-[#282828] hover:bg-[#141414]'} text-white px-2 py-1 rounded-md text-[12px]`}
                            disabled={(currentUser != null && currentUser.role != 0) && isBeforeToday(slot.startDate)}
                            onClick={() => handleEditClick(index)}
                          >
                            수정
                          </Button>
                        )}
                        {handleSingleDelete && currentUser && currentUser.role === 0 && (
                          <Button
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-[12px]"
                            onClick={() => handleSingleDelete(slot.seq)}
                          >
                            삭제
                          </Button>
                        )}
                        {handleSingleExtend && (
                          <Button
                            className="bg-[#9760ff] hover:bg-[#651eeb] text-white px-2 py-1 rounded-md text-[12px]"
                            onClick={() => handleSingleExtend(slot.seq)}
                          >
                            연장
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                )}
                {showActionColumn && !showActions && (
                  <td className="py-3 px-2 border-b border-gray-200"></td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SlotTable;
