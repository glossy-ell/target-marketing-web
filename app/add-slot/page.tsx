'use client';

import { useState, useEffect, useRef } from 'react';
import PageHeader from '../components/common/PageHeader';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ReactDatePicker from "react-datepicker";
import { ko } from 'date-fns/locale';
import { addMonths } from "date-fns";

interface User {
  seq: number;
  id: string;
  name: string;
  role: number;
}

export default function AddSlot() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [quantity, setQuantity] = useState<string>("1");
  const [keywordLimit, setKeywordLimit] = useState<string>("4");
  const [userRole, setUserRole] = useState<number | null>(null);
  const [weekendOpen,setWeekendOpen] = useState<boolean>(false);
  const [time, setTime] = useState<{ open_start_time: string; open_end_time: string; edit_start_time: string; edit_end_time:string;} | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
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



  const formatDate = (date: Date) =>
  date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\. /g, '-').replace(/\.$/, ''); 

  // const getStartAndEndDate = (duration: number) => {
  //   const now = new Date();
  //   const start = new Date();

  //   // 기준: 오늘 날짜가 아닌, "내일 00:00" 기준으로 판단
  //   const cutoff = new Date();
  //   cutoff.setHours(0, 0, 0, 0); // 오늘 00:00
  //   cutoff.setDate(cutoff.getDate() + 1); // 내일 00:00

  //   // 지금 시간이 내일 00:00 이후면 → 시작일은 모레
  //   if (now >= cutoff) {
  //     start.setDate(start.getDate() + 2);
  //   } else {
  //     // 아직 0시 이전이면 → 시작일은 내일
  //     start.setDate(start.getDate() + 1);
  //   }

  //   const end = new Date(start);
  //   end.setDate(start.getDate() + (duration - 1));

  //   return {
  //     startDate: formatDate(start),
  //     endDate: formatDate(end),
  //   };
  // };


 const getStartAndEndDate = (duration: number) => {
     const start = new Date();
 

     start.setDate(start.getDate() + 1);
     const end = new Date(start);
     
     end.setDate(start.getDate() + (duration - 1));
     return {
       startDate: formatDate(start),
       endDate: formatDate(end),
     };
   };


  const [{ startDate, endDate }, setDates] = useState(() => getStartAndEndDate(7));

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [duration, setDuration] = useState<number>(7); // 기본 7일
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [currentUser, setCurrentUser] = useState<{ id: string; seq: number; role: number; excelAllow:number; additionalRegAllow:number; slotAllow:number; userAllow: number;} | null>(null);

  useEffect(() => {
    setDates(getStartAndEndDate(duration));
    const start = new Date();
      start.setDate(start.getDate() + 1);
      setSelectedStartDate(start);
  }, [duration]);
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        if (!res.ok) throw new Error('로그인 정보 없음');
        const user = await res.json();
        setCurrentUser({ id: user.id, seq: user.seq, role: Number(user.role),excelAllow: Number(user.excelAllow), additionalRegAllow:  Number(user.additionalRegAllow), slotAllow: Number(user.slotAllow),userAllow:Number(user.userAllow)});
        setUserRole(Number(user.role));
      } catch (err) {
        console.error('유저 인증 실패:', err);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (userRole === null) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('사용자 데이터를 불러올 수 없습니다.');

        const data: User[] = await response.json();

        let filtered = data;
   
        setUsers(filtered);
      } catch (err) {
        console.error('사용자 목록 로드 실패:', err);
      }
    };

    fetchUsers();
  }, [userRole]);

  const handleSubmit = async () => {
    const now = new Date();
    const nowTime = now.toTimeString().slice(0,8);
    const day = now.getDay(); // 0: 일요일, 6: 토요일

    const openStartTime = time?.open_start_time || "23:59:59";
    const openEndTime = time?.open_end_time || "00:00:00";

    if(currentUser == null || !currentUser.slotAllow){
      alert(`권한이 없습니다`);
      return;
    }


    if(nowTime< openStartTime || nowTime>openEndTime){
      alert(`현시각에는 추가작업이 불가능합니다.\n현재 시간: ${nowTime}\n작업 가능 시간: ${openStartTime} ~ ${openEndTime}`);
      return;
    }

    // const isWeekend = (day === 0 || day === 6);

    if(!weekendOpen ){
      alert(`슬롯 업로드가 제한되어있습니다.`);
      return;
    }


    if(!selectedUser){
      alert('회원을 선택해주세요.');
      return;
    }

    if (!selectedUser || Number(quantity) <= 0 || !startDate || !endDate) {
      alert('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    let keywordLimitCheck = "0";
    let extraTime = 0;
    if(Number(keywordLimit) <= 4)
      keywordLimitCheck = keywordLimit;
    else if (Number(keywordLimit)==5){
      keywordLimitCheck = "4";
      extraTime = 1;
    }

    const slotData = Array.from({ length: Number(quantity) }, () => ({
      userId: selectedUser,
      startDate,
      endDate,
      keywordLimit:Number(keywordLimitCheck),
      extraTime,
    }));

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slotData),
      });


      if (response.status === 401) {
        window.location.href = '/';
        return; 
      }
      if (!response.ok) throw new Error('슬롯 추가 실패');

      alert('슬롯이 성공적으로 추가되었습니다.');
      setSelectedUser('');
      setQuantity("1");
      setKeywordLimit("4");
      setSearchTerm('');
      setDates(getStartAndEndDate(7));
    } catch (error) {
      console.error('슬롯 추가 오류:', error);
      alert('슬롯 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      <PageHeader
        title="슬롯단일추가"
        description="슬롯을 등록할 수 있습니다."
      />
      <div className="max-w-xl mx-auto bg-gray-100 p-6 rounded-lg shadow mt-10">
        <label className="block mb-2 font-medium">회원 선택</label>
        <div className="relative mb-4" ref={dropdownRef}>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="회원 이름 또는 ID로 검색"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
          />

          {selectedUser && (
            <button
              type="button"
              onClick={() => {
                setSelectedUser('');
                setSearchTerm('');
                setDropdownOpen(true);
              }}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}

          {dropdownOpen && (
            <ul className="absolute w-full border rounded max-h-40 overflow-y-auto bg-white z-10 mt-1 shadow">
              {filteredUsers.length === 0 ? (
                <li className="p-2 text-gray-500">검색 결과 없음</li>
              ) : (
                filteredUsers.map((user) => (
                  <li
                    key={user.seq}
                    className={`p-2 cursor-pointer hover:bg-gray-100 ${selectedUser === String(user.seq) ? 'bg-gray-200' : ''
                      }`}
                    onClick={() => {
                      setSelectedUser(String(user.seq));
                      setSearchTerm(`${user.name} (${user.id})`);
                      setDropdownOpen(false);
                    }}
                  >
                    {user.name} ({user.id})
                  </li>
                ))
              )}
            </ul>
          )}
        </div>

        <label className="block mb-2 font-medium">수량</label>
        <input
          type="number"
          className="w-full p-2 border rounded mb-4"
          value={quantity}
          min={1}
          max={1000}
          onChange={(e) => {
            const val = e.target.value;
            // 숫자 또는 빈 문자열만 허용
            if (/^\d*$/.test(val)) {
              if (val === '' || Number(val) <= 1000) {
                setQuantity(val);
              }
            }
          }}
        />
        
        <label className="block mb-2 font-medium">상품명 추가</label>
        <input
          type="number"
          className="w-full p-2 border rounded mb-4"
          value={keywordLimit}
          min={1}
          max={5}
          onChange={(e) => {
            const val = e.target.value;
            // 숫자 또는 빈 문자열만 허용
            if (/^\d*$/.test(val)) {
              if (val === '') {
                setKeywordLimit('');
              } else if (Number(val) >= 1 && Number(val) <= 5) {
                setKeywordLimit(val);
              }
            }
          }}
          onBlur={() => {
            if (keywordLimit === '' || Number(keywordLimit) < 1) {
              setKeywordLimit("1");
            }
          }
        }
        />

        <label className="block mb-2 font-medium">기간 선택</label>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setDuration(7)}
            className="flex-1 px-4 py-1 bg-[#6449FC] text-white rounded hover:bg-[#5a3ee0] transition"
          >
            7일
          </button>
          <button
            onClick={() => setDuration(10)}
            className="flex-1 px-4 py-1 bg-[#6449FC] text-white rounded hover:bg-[#5a3ee0] transition"
          >
            10일
          </button>
          <div className="flex-1 flex items-center gap-2 px-2 py-1 border rounded bg-white">
            <span className="text-sm text-gray-600 whitespace-nowrap">직접입력:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={duration}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) setDuration(val);
              }}
              className="w-full p-2 border rounded text-center"
            />
            <span className="text-sm text-gray-600 whitespace-nowrap">일</span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between bg-white border rounded-lg p-4 shadow-sm">
            <div className="text-gray-600">
              <div className="text-sm">작업 시작일</div>
              <ReactDatePicker
                  selected={new Date(startDate)} // 현재 startDate 값 반영
                  onChange={(date: Date | null) => {
                    if (date) {
                      const formattedStart = formatDate(date); // 시작일 포맷
                      const end = new Date(date);
                      end.setDate(end.getDate() + (duration - 1)); // duration 만큼 더해서 종료일 계산
                      const formattedEnd = formatDate(end);

                      // 시작일과 종료일 동시 업데이트
                      setDates({ startDate: formattedStart, endDate: formattedEnd });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  className="border px-1 py-1 rounded text-lg font-semibold text-[#6449FC] w-[150px]"
                  locale={ko}
                />
            </div>
            <div className="text-gray-400 text-xl px-2">→</div>
            <div className="text-gray-600 text-right">
              <div className="text-sm">작업 종료일</div>
              <div className="text-lg font-semibold text-[#6449FC]">{endDate}</div>
            </div>
          </div>
        </div>


        <button
          onClick={handleSubmit}
          className="w-full p-3 bg-[#6449FC] text-white font-medium rounded-lg hover:bg-[#5a3ee0] transition"
        >
          슬롯 추가
        </button>
      </div>
    </>
  );
}
function setError(arg0: string) {
  throw new Error('Function not implemented.');
}

