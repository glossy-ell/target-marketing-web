import { LocalizationProvider, TimeField } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import React, { useState } from 'react';

type ConfigData = {
  openStartTime: string;
  openEndTime: string;
  editStartTime: string;
  editEndTime: string;
};

type SystemConfigProps = {
  weekendOpen: boolean;
  setWeekendOpen : React.Dispatch<React.SetStateAction<boolean>>;
  configData: ConfigData;
  setConfigData: React.Dispatch<React.SetStateAction<ConfigData>>;
  saveConfig: () => void;
};

export default function SystemConfig({ weekendOpen,setWeekendOpen,configData, setConfigData, saveConfig }: SystemConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState('00:00');


  return (
    <div className="col-span-2 mt-4 mb-4 p-4 border rounded bg-white shadow-sm cursor-pointer"      onClick={(e) => {
      // 정확히 이 div 자체가 클릭된 경우만 toggle 실행
      if (e.target === e.currentTarget) {
        setIsOpen((prev) => !prev);
      }
    }}>


          <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen((prev) => !prev)}>
            <h4 className="font-bold mb-2">📅 시스템 설정</h4>
            <span className="text-xl">{isOpen ? "▲" : "▼"}</span>
          </div>

      {/* 접히는 본문 */}
      {isOpen && (
        <div className='cursor-default'>
        <div className="grid grid-cols-2 gap-4 ">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div>
              <label className="block text-sm font-medium mb-1">오픈 시작 시간</label>
              <TimeField
                ampm={true}
                format="HH:mm"
                 sx={{ width: 70, fontSize: '0.875rem' }}
                 value={configData.openStartTime ? new Date(`2000-01-01T${configData.openStartTime}`) : new Date('2000-01-01T00:00')}
                onChange={(newValue) => {
                const time = newValue
                  ? newValue.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',    // 초까지 포함
                      hour12: false,
                    })
                  : ''; // undefined 방지

                setConfigData((prev) => ({
                  ...prev,
                  openStartTime: time, // 항상 string
                }));
              }}
              />
            </div>
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div>
              <label className="block text-sm font-medium mb-1">오픈 마감 시간</label>
              <TimeField
                ampm={false}
                format="HH:mm"
                sx={{ width: 70, fontSize: '0.875rem' }}
                 value={configData.openEndTime ? new Date(`2000-01-01T${configData.openEndTime}`) : new Date('2000-01-01T00:00')}
                onChange={(newValue) => {
                const time = newValue
                  ? newValue.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''; // undefined 방지

                setConfigData((prev) => ({
                  ...prev,
                  openEndTime: time, // 항상 string
                }));
              }}
              />
            </div>
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div>
              <label className="block text-sm font-medium mb-1">수정 시작 시간</label>
              <TimeField
                ampm={false}
                format="HH:mm"
                sx={{ width: 70, fontSize: '0.875rem' }}
                 value={configData.editStartTime ? new Date(`2000-01-01T${configData.editStartTime}`) : new Date('2000-01-01T00:00')}
                onChange={(newValue) => {
                const time = newValue
                  ? newValue.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''; // undefined 방지

                setConfigData((prev) => ({
                  ...prev,
                  editStartTime: time, // 항상 string
                }));
              }}
              />
            </div>
          </LocalizationProvider>
           <LocalizationProvider dateAdapter={AdapterDateFns}>
            <div>
              <label className="block text-sm font-medium mb-1">수정 마감 시간</label>
              <TimeField
                ampm={false}
                format="HH:mm"
                sx={{ width: 70, fontSize: '0.875rem' }}
                 value={configData.editEndTime ? new Date(`2000-01-01T${configData.editEndTime}`) : new Date('2000-01-01T00:00')}
                onChange={(newValue) => {
                const time = newValue
                  ? newValue.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''; // undefined 방지

                setConfigData((prev) => ({
                  ...prev,
                  editEndTime: time, // 항상 string
                }));
              }}
              />
            </div>
          </LocalizationProvider>

           <div>
            <label className="block text-sm font-medium mb-1">슬롯 허용</label>
            <label className="relative inline-block w-10 h-5 cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={weekendOpen}
                onChange={(e) => {
                    setWeekendOpen(e.target.checked);
                }}
              />
              <div className="w-full h-full bg-gray-300 rounded-full peer-checked:bg-[#282828] transition-colors duration-200"></div>
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 peer-checked:translate-x-5"></div>
            </label>
            </div>
        </div>


        <div className="mt-4 text-right">
          <button
            onClick={saveConfig}
            className="bg-[#282828] hover:bg-[#141414] text-white px-4 py-2 rounded"
          >
            설정 저장
          </button>
        </div>
         </div>)}
     </div>
  );
}
