'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import ReactDatePicker from "react-datepicker";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import axios from "axios";
import { addMonths } from "date-fns";
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import * as XLSX from 'xlsx-js-style';

interface Props {

  setTotalCount: (count: number) => void;
  setTotalIssuedCount: (count: number) => void;
  setTotalRefundCount: (count: number) => void;
  setTotalCancelCount: (count: number) => void;
  setTotalSettleCount: (count: number) => void;


  searchTotalIssued: boolean;
  searchTotalRefund: boolean;
  searchTotalCancel: boolean;
  searchTotalSettle: boolean;


  page : number;
  setPage: Dispatch<SetStateAction<number>>;
};

interface Log {
  seq: number;
  slotSeq: number;
  type: number;
  user: string;
  agency: string;
  distributor: string;
  adjustmentDay: number;

  bundleIdx: number;
  slotIdx: number
  createdAt: string; // = 정산일시
  startAt: string;
  endAt: string;
  refundAt: string; // 환불일
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

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

const LogList = ({
  setTotalCount,
  setTotalIssuedCount,
  setTotalRefundCount,
  setTotalCancelCount,
  setTotalSettleCount,

  searchTotalIssued,
  searchTotalRefund,
  searchTotalCancel,
  searchTotalSettle,

  page,
  setPage,
}: Props) => {

  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);


  const [isSearch, setIsSearch] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [selectedDate1, setSelectedDate1] = useState<Date | null>(null);

  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedDate2, setSelectedDate2] = useState<Date | null>(null);


  const [slotStartDate, setSlotStartDate] = useState<Date | null>(null);
  const [selectedDate3, setSelectedDate3] = useState<Date | null>(null);

  const [slotEndDate, setSlotEndDate] = useState<Date | null>(null);
  const [selectedDate4, setSelectedDate4] = useState<Date | null>(null);


  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number } | null>(null);

  const MySwal = withReactContent(Swal);
  const datepickerRef = useRef(null);

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
  const isAgency = currentUser?.role === 2;

  // 검색 변수
  const [pageCount, setPageCount] = useState<number>(20);
  const [logType, setLogType] = useState<number>(0);

  const [agencyList, setAgencyList] = useState([]);
  const [distributorList, setDistributorList] = useState([]);


  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedAgency, setSelectedAgency] = useState<string>("");
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");


  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page. toString(),
        pageSize: itemsPerPage.toString(),
      });

      const response = await axios.get(`/api/log/list?${params}`, {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-store', // 캐시를 완전히 사용하지 않도록 설정
        },
      });

      if (!(response.status == 200)) throw new Error('데이터를 불러오는데 실패했습니다.');

      const json = response.data;

      const { data, totalPages, totalCount,totalIssuedCount, totalRefundCount, totalCancelCount, totalSettlement,
        refundIssuedSum,refundIssuedSumAgency,refundIssuedSumUser,totalIssuedSum,totalIssuedSumAgency,totalIssuedSumUser
       } = json;
      if (!Array.isArray(data)) throw new Error('잘못된 데이터 형식입니다.');

      setLogs(data);
      setTotalPages(totalPages);


      setTotalCount(totalCount);
      setTotalIssuedCount(totalIssuedCount);
      setTotalRefundCount(totalRefundCount);
      setTotalCancelCount(totalCancelCount);
      setTotalSettleCount(totalSettlement);




  

    } catch (err: unknown) {
      console.error('error occurs while fetch logs error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const [startPage, setStartPage] = useState<number>(1);
  const [endPage, setEndPage] = useState<number>(1);

  useEffect(() => {
    const maxButtons = 10;
    const half = Math.floor(maxButtons / 2);

    let newStartPage = Math.max(1, page - half);
    let newEndPage = Math.min(totalPages, newStartPage + maxButtons - 1);

    if (newEndPage - newStartPage + 1 < maxButtons) {
      newStartPage = Math.max(1, newEndPage - maxButtons + 1);
    }

    setStartPage(newStartPage);
    setEndPage(newEndPage);
  }, [page, totalPages]);



  useEffect(() => {
    // 대행 목록 불러오기
    fetch('/api/users/agencies')
      .then((res) => res.json())
      .then((data) => setAgencyList(data));

    // 총판 목록도 API로 따로 만들어서 불러온다고 가정
    fetch('/api/users/distributors')
      .then((res) => res.json())
      .then((data) => setDistributorList(data));
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }

        if (!res.ok) throw new Error('유저 목록 불러오기 실패');
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError('유저 데이터를 불러오는 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);


  useEffect(() => {
    if(!currentUser)
      return;
    if (
      isSearch === false &&
      !searchTotalIssued &&
      !searchTotalRefund &&
      !searchTotalCancel &&
      !searchTotalSettle
    )
      fetchLogs();
    else
      commSearch(page);
  }, [currentUser,isSearch, page, itemsPerPage, logType, selectedUser, selectedAgency, selectedDistributor, startDate, endDate, slotStartDate, slotEndDate,searchTotalIssued,searchTotalRefund,searchTotalCancel,searchTotalSettle]);

  async function commSearch(page = 1) {

    var formData = new FormData();
    setIsSearch(true);
    formData.append("pageCount", String(pageCount));
    formData.append("logType", String(logType));

    if (selectedDistributor != "")
      formData.append("distributor", selectedDistributor);

    if (selectedAgency != "")
      formData.append("agency", selectedAgency);
    if (selectedUser != "")
      formData.append("user", selectedUser);

    if (startDate != null) {
      const yyyy = startDate.getFullYear();
      const mm = String(startDate.getMonth() + 1).padStart(2, '0');
      const dd = String(startDate.getDate()).padStart(2, '0');
      formData.append("startDate", `${yyyy}-${mm}-${dd}`);
    }

    if (endDate != null) {
      const yyyy = endDate.getFullYear();
      const mm = String(endDate.getMonth() + 1).padStart(2, '0');
      const dd = String(endDate.getDate()).padStart(2, '0');
      formData.append("endDate", `${yyyy}-${mm}-${dd}`);
    }

    if (slotStartDate != null)
      formData.append(
        "slotStartDate",
        slotStartDate.toLocaleDateString("ko-KR", { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
      );

    if (slotEndDate != null)
      formData.append(
        "slotEndDate",
        slotEndDate.toLocaleDateString("ko-KR", { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
      );

    if (page == null) {
      page = 1;
    }

    if(searchTotalIssued){
      formData.append("searchTotalIssued", String(1));
    }
    if(searchTotalRefund){
      formData.append("searchTotalRefund", String(1));
    }
    if(searchTotalCancel){
      formData.append("searchTotalCancel", String(1));
    }
    if(searchTotalSettle){
      formData.append("searchTotalSettle", String(1));
    }

    try {

      const response = await axios.post(`/api/log/list/search/${page}`, formData, {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-store', // 캐시를 완전히 사용하지 않도록 설정
        },
      });

      setLogs(response.data.data);


      // setTotalIssuedCount(response.data.totalIssuedCount);
      // setTotalRefundCount(response.data.totalRefundCount);
      // setTotalCancelCount(response.data.totalCancelCount);
      // setTotalSettleCount(response.data.totalSettlement);




      setTotalPages(response.data.totalPages);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError(error instanceof Error ? error.message : '세션 만료');
          setLogs([]);
          window.location.href = '/';
        }
        else if (error.response?.status === 415) {
          setError(error instanceof Error ? error.message : '알 수 없는 오류');
          setLogs([]);
        } else if (error.response?.status === 402) {
          setError(error instanceof Error ? error.message : '알 수 없는 오류');
          setLogs([]);
        }
      } else {
        setError(error instanceof Error ? error.message : '알 수 없는 오류');
        setLogs([]);
      }
    } finally {
      setLoading(false);
    }

  }


   async function commSearchAll() { // 엑셀 로그용 전체 로그 다운로드

    var formData = new FormData();

    formData.append("pageCount", "-1");
    formData.append("logType", String(logType));

    if (selectedDistributor != "")
      formData.append("distributor", selectedDistributor);

    if (selectedAgency != "")
      formData.append("agency", selectedAgency);
    if (selectedUser != "")
      formData.append("user", selectedUser);

    if (startDate != null) {
      const yyyy = startDate.getFullYear();
      const mm = String(startDate.getMonth() + 1).padStart(2, '0');
      const dd = String(startDate.getDate()).padStart(2, '0');
      formData.append("startDate", `${yyyy}-${mm}-${dd}`);
    }

    if (endDate != null) {
      const yyyy = endDate.getFullYear();
      const mm = String(endDate.getMonth() + 1).padStart(2, '0');
      const dd = String(endDate.getDate()).padStart(2, '0');
      formData.append("endDate", `${yyyy}-${mm}-${dd}`);
    }

    if (slotStartDate != null)
        formData.append(
        "slotStartDate",
        slotStartDate.toLocaleDateString("ko-KR", { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
      );

    if (slotEndDate != null)
       formData.append(
        "slotEndDate",
        slotEndDate.toLocaleDateString("ko-KR", { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
      );


    if(searchTotalIssued){
      formData.append("searchTotalIssued", String(1));
    }
    if(searchTotalRefund){
      formData.append("searchTotalRefund", String(1));
    }
    if(searchTotalCancel){
      formData.append("searchTotalCancel", String(1));
    }


    try {

      const response = await axios.post(`/api/log/list/search/1`, formData, {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-store', // 캐시를 완전히 사용하지 않도록 설정
        },
      });

      return response.data.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setError(error instanceof Error ? error.message : '세션 만료');
          window.location.href = '/';
        }
        else if (error.response?.status === 415) {
          setError(error instanceof Error ? error.message : '알 수 없는 오류');
          return [];
        } else if (error.response?.status === 402) {
          setError(error instanceof Error ? error.message : '알 수 없는 오류');
          return [];
        }
      } else {
        setError(error instanceof Error ? error.message : '알 수 없는 오류');
        return [];
      }
    } finally {
      setLoading(false);
    }

  }


    const headerMapLog: Record<string, string> = {
      "번호": `번호`,
      "슬롯 번호": "슬롯 번호",
      "오픈일": "오픈일",
      "환불일": "환불일",
      "총판 ID": "총판 ID",
      "대행 ID": "대행 ID",
      "클라이언트 ID": "클라이언트 ID",
      "구분": "구분",
      "정산일수": "정산일수",
      "유입수": "유입수",
      // "환불가": "환불가",
      "시작일": "시작일",
      "종료일": "종료일",
    };

     const convertLogsToExcelData = (logs : Log[]) => {
      const result: any[] = [];
       logs.forEach((log) => {
        const baseRow = {
          '번호': log.seq,
          '슬롯 번호': log.slotSeq,
          "오픈일": log.createdAt.slice(0, 10),
          "환불일": log.refundAt?.slice(0, 10) ?? '-',
          '총판 ID': log.distributor?? '-',
          '대행 ID': log.agency?? '-',
          '클라이언트 ID': log.user,
          '구분':log.type == 1
                ? "발급"
                : log.type == 2
                ? "연장"
                : log.type == 3
                ? "환불"
                : log.type == 4
                ? "철회"
                : "",
          '정산일수': log.adjustmentDay,
          '유입수' : log.adjustmentDay * 100,
          '시작일': log.startAt.slice(0, 10),
          '종료일': log.endAt.slice(0, 10),
        };
        result.push(baseRow);
      });
        return result;
    };


    const logExcelDownload= async () => {

        const searchData :Log[] = await commSearchAll();

        const logData = convertLogsToExcelData(searchData);
        const logHeaders = Object.entries(headerMapLog);

        if(logs.length !=0){
        const logSheetData = [
          logHeaders.map(([_, desc]) => desc),
          ...logData.map(row => logHeaders.map(([key]) => row[key] ?? ''))
        ];

        const logWorkSheet = XLSX.utils.aoa_to_sheet(logSheetData);

        // ✅ 헤더 셀에 wrapText 스타일 적용
        logHeaders.forEach((_, colIdx) => {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
          const cell = logWorkSheet[cellAddress];
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

        // ✅ 데이터 셀 스타일 적용 (왼쪽 정렬)
        logData.forEach((_, rowIdx) => {
          logHeaders.forEach((_, colIdx) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx }); // +1은 헤더 제외
            const cell = logWorkSheet[cellAddress];
            if (cell) {
              cell.s = {
                alignment: {
                  horizontal: "left", // 왼쪽 정렬
                  vertical: "top",
                  wrapText: true
                },
                font: {
                  name: "맑은 고딕",
                  sz: 10
                }
              };
            }
          });
        });


        logWorkSheet['!cols'] = [
          { wch: 20 },   //번호
          { wch: 20 },   //슬롯 번호
          { wch: 20 },   //오픈일
          { wch: 20 },   //환불일
          { wch: 42 },   //총판
          { wch: 42 },   //대행
          { wch: 42 },   //클라이언트
          { wch: 10 },   //구분
          { wch: 10 },   //정산일수
          { wch: 10 },   //유입수
          { wch: 20 },   //시작일
          { wch: 20 }    //종료일
        ];

        const keywordWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(keywordWorkbook, logWorkSheet, 'my_sheet');
        XLSX.writeFile(keywordWorkbook, '로그_엑셀.xlsx');
      }else{

        alert("엑셀 데이터가 없습니다.")
        return;
      }
    };



  //검색 초기화
  function commSearchReset() {
    location.href = "/log";
  }

  return (
    <div className="px-8 py-6 bg-white text-black min-h-screen rounded-lg shadow-lg">
      <div className="mb-3 flex flex-col items-start gap-2 justify-start">         {/* flex flex-col -> 최상위 요소 세로 배치 설정  */}
        <div className="px-8 py-6 bg-white text-black rounded-lg shadow-[rgba(0,0,0,0.07)_4px_4px_15px_0px] mb-6">
          <div className="flex flex-wrap gap-3 items-center">

            {/* 페이지 수 선택 */}
            <select
              value={pageCount}
              onChange={(e) => {
                setIsSearch(true);
                setPageCount(Number(e.target.value));
              }}
              className="border border-gray-300 px-3 py-2 rounded text-sm"
            >
              {[20, 80, 100, 1000, 10000].map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>

            {/* 로그 타입 선택 */}
            <select
              value={logType}
              onChange={(e) => {
                setIsSearch(true);
                setLogType(Number(e.target.value));
              }}
              className="border border-gray-300 px-3 py-2 rounded text-sm"
            >
              <option value="0">로그타입</option>
              <option value="1">발급로그</option>
              <option value="2">연장로그</option>
              <option value="3">환불로그</option>
              <option value="4">철회로그</option>
            </select>

            {/* 총판 선택 */}
            {isAdmin && (
              <select
                value={selectedDistributor}
                onChange={(e) => {
                  setIsSearch(true);
                  setSelectedDistributor(e.target.value);
                }}
                className="border border-gray-300 px-3 py-2 rounded text-sm"
              >
                <option value="">총판 선택</option>
                {distributorList.map((d: any) => (
                  <option key={d.seq} value={d.seq}>
                    {d.name} ({d.id})
                  </option>
                ))}
              </select>
            )}

            {/* 대행 선택 */}
            {(isAdmin || isDistributor) && (
              <select
                value={selectedAgency}
                onChange={(e) => {
                  setIsSearch(true);
                  setSelectedAgency(e.target.value);
                }}
                className="border border-gray-300 px-3 py-2 rounded text-sm"
              >
                <option value="">대행 선택</option>
                {agencyList.map((a: any) => (
                  <option key={a.seq} value={a.seq}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            )}

            {/* 사용자 선택 */}
            {(isAdmin || isDistributor || isAgency) && (
              <select
                value={selectedUser}
                onChange={(e) => {
                  setIsSearch(true);
                  setSelectedUser(e.target.value);
                }}
                className="border border-gray-300 px-3 py-2 rounded text-sm"
              >
                <option value="">사용자 선택</option>
                {users.map((user: any) => (
                  <option key={user.seq} value={user.seq}>
                    {user.name} ({user.id})
                  </option>
                ))}
              </select>
            )}

            {/* 날짜 선택 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              <ReactDatePicker
                className="min-w-[120px] h-8 px-2 border border-gray-300 rounded text-sm"
                selected={selectedDate1}
                onChange={(date) => {
                  if (date) {
                    const d = new Date(date);
                    d.setHours(0, 0, 0, 0);
                    setIsSearch(true);
                    setSelectedDate1(d);
                    setStartDate(d);
                  }
                }}
                placeholderText="요청/접수신청 시작일"
                shouldCloseOnSelect
                maxDate={addMonths(new Date(), 4)}
                locale={ko}
              />
              <span>~</span>
              <ReactDatePicker
                className="min-w-[120px] h-8 px-2 border border-gray-300 rounded text-sm"
                selected={selectedDate2}
                onChange={(date) => {
                  if (date) {
                    setIsSearch(true);
                    setSelectedDate2(date);
                    setEndDate(date);
                  }
                }}
                placeholderText="요청/접수신청 종료일"
                shouldCloseOnSelect
                maxDate={addMonths(new Date(), 4)}
                locale={ko}
              />
            </div>

            {/* 슬롯 기간 필터 */}
            <div className="flex items-center gap-2 flex-wrap">
              <ReactDatePicker
                className="min-w-[120px] h-8 px-2 border border-gray-300 rounded text-sm"
                selected={selectedDate3}
                onChange={(date) => {
                  if (date) {
                    setIsSearch(true);
                    setSelectedDate3(date);
                    setSlotStartDate(date);
                  }
                }}
                placeholderText="슬롯 시작일"
                shouldCloseOnSelect
                maxDate={addMonths(new Date(), 4)}
                locale={ko}
              />
              <span>~</span>
              <ReactDatePicker
                className="min-w-[120px] h-8 px-2 border border-gray-300 rounded text-sm"
                selected={selectedDate4}
                onChange={(date) => {
                  if (date) {
                    setIsSearch(true);
                    setSelectedDate4(date);
                    setSlotEndDate(date);
                  }
                }}
                placeholderText="슬롯 종료일"
                shouldCloseOnSelect
                maxDate={addMonths(new Date(), 4)}
                locale={ko}
              />
            </div>



            {/* 검색 / 초기화 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => commSearch()}
                className="border border-gray-400 px-4 py-2 rounded text-white text-sm bg-[#282828] hover:bg-[#141414]"
              >
                검색
              </button>
              <button
                onClick={() => commSearchReset()}
                className="border border-gray-400 px-4 py-2 rounded text-sm hover:bg-gray-100"
              >
                초기화
              </button>
                <button
                onClick={() => logExcelDownload()}
                className="border border-gray-400 px-4 py-2 rounded text-sm hover:bg-[#282828] hover:text-white"
              >
                엑셀 다운로드
              </button>
            </div>
          </div>
        </div>


        {loading ? (
          <div className="p-6 text-center text-lg animate-pulse text-gray-500">
            🔄 로그 정보를 불러오는 중...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 font-semibold">
            ⚠ 오류: {error}
          </div>
        ) : (
          <>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-lg font-light">
                🔍 조건에 맞는 로그가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-md w-full">
                <table className="text-xs min-w-full text-center bg-white rounded-lg overflow-hidden border border-gray-200">
                  <thead className="text-xs bg-gray-100 text-gray-700 font-semibold">
                    <tr>
                      <th className="px-5 py-4 border-b border-gray-300">번호</th>
                      <th className="px-5 py-4 border-b border-gray-300">슬롯 번호</th>
                      <th className="px-5 py-4 border-b border-gray-300">오픈일</th>
                      <th className="px-5 py-4 border-b border-gray-300">환불일</th>
                      {isAdmin && (
                        <th className="px-5 py-4 border-b border-gray-300">총판 ID</th>
                      )}

                      {(isAdmin || isDistributor) && (
                        <th className="px-5 py-4 border-b border-gray-300">대행 ID</th>
                      )}

                      <th className="px-5 py-4 border-b border-gray-300">사용자 ID</th>
                      {/* 기존 컬럼들 */}
                      <th className="px-5 py-4 border-b border-gray-300">구분</th>
                      <th className="px-5 py-4 border-b border-gray-300">정산일수</th>
                      <th className="px-5 py-4 border-b border-gray-300">유입수</th>
                      {/* <th className="px-5 py-4 border-b border-gray-300">환불가</th> */}
                      <th className="px-5 py-4 border-b border-gray-300">시작일</th>
                      <th className="px-5 py-4 border-b border-gray-300">종료일</th>
                    </tr>
                  </thead>


                  <tbody>
                    {logs.map((log, index) => {

                      return (
                        <tr
                          key={log.seq}
                          className="hover:bg-gray-100 transition-colors duration-200"
                        >
                          <td className="p-3 border-b border-gray-200">
                            {log.seq}
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            {log.slotSeq}
                          </td>
                 
                          <td className="p-3 border-b border-gray-200">
                            {log.createdAt
                              ? (() => {
                                  const date = new Date(log.createdAt);
                                  date.setHours(date.getHours() + 9); // UTC → KST
                                  return date.toISOString().substring(0, 10);
                                })()
                              : ""}
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            {log.refundAt
                              ? (() => {
                                  const date = new Date(log.refundAt);
                                  date.setHours(date.getHours() + 9); // UTC → KST
                                  return date.toISOString().substring(0, 10);
                                })()
                              : "-"}
                          </td>
                          {isAdmin && (
                            <>
                              <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                                {log.distributor || '-'}
                              </td>
                              <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                                {log.agency || '-'}
                              </td>
                            </>
                          )}
                          {isDistributor && !isAdmin && (
                            <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                              {log.agency || '-'}
                            </td>
                          )}
                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                            {log.user}
                          </td>

                          <td className="p-3 border-b border-gray-200 max-w-xs break-words">
                             {log.type == 1 ? (
                              "발급"
                            ) : log.type == 2 ? (
                              "연장"
                            ) : log.type == 3 ? (
                              "환불"
                            ) : log.type == 4 ? (
                              "철회"
                            ) : ("")}
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            {log.adjustmentDay}
                          </td>
                          <td className="p-3 border-b border-gray-200">

                            {log.adjustmentDay *100}
                          </td>
                 
                          <td className="p-3 border-b border-gray-200">
                            {log.startAt
                              ? (() => {
                                  const date = new Date(log.startAt);
                                  date.setHours(date.getHours() + 9); // UTC → KST
                                  return date.toISOString().substring(0, 10);
                                })()
                              : ""}
                          </td>
                          <td className="p-3 border-b border-gray-200">
                            {log.endAt
                              ? (() => {
                                  const date = new Date(log.endAt);
                                  date.setHours(date.getHours() + 9); // UTC → KST
                                  return date.toISOString().substring(0, 10);
                                })()
                              : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </>
        )}
      </div>
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
    </div>
  );
};


export default LogList;
