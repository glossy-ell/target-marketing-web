'use client';

import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx-js-style';

interface Slot {
  seq: number;
  userId: string;
  agencyId: string;
  distributorId: string;
  keyword: string;
  mainKeyword?: string | null;
  startDate: string;
  endDate: string;
  rank: string;
  memo: string;
  singleLink: string;
  errMsg: string;
  mid: string | null;
  hasRanking: number;
  createdAt: string;
}


 const headerMapKeyword: Record<string, string> = {
      "슬롯번호": "슬롯번호",
      "상점명": `상점 명`,
   "메인 키워드": "메인 키워드",
      "상품 링크": "상품 링크",
      "가격비교링크": "가격비교링크",
      "시작 날짜": "시작 날짜",
      "종료 날짜": "종료 날짜",
      "검색어": "검색어",
      "상품 이미지 URL": "상품 이미지 URL",
      "상품 가격": "상품 가격",
      "상품 URL": "상품 URL",
      "MID": "MID",
    };

  function excelSerialToDate(serial: number): Date {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // 엑셀 기준
    return new Date(excelEpoch.getTime() + serial * 86400000);
  }
  function parseExcelDate(value: any): Date | null {
    if (!value) return null;

    // 엑셀 serial number
    if (typeof value === 'number') {
      return excelSerialToDate(value);
    }

    // 문자열 날짜
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  }
export default function ExcelUploadPopupPage() {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isExcelUpload,setIsExcelUpload] = useState<boolean>(false);
  useEffect(() => {
    // 부모에게 준비 완료 신호
    window.opener?.postMessage('popup-ready', window.location.origin);
  }, []);

  const downloadExcelTemplate = () => {
    // 확장된 엑셀 템플릿: 업로드에서는 '클라이언트 ID'만 필수로 사용
      const headers = [
        '타입',
        '클라이언트 ID',
        '개수',
        '키워드',
        '메인 키워드',
        '상품 링크',
        '가격비교링크',
        'MID',
        '시작일',
        '종료일',
        '메모',
      ];

    // 두 번째 행에 샘플값: 타입은 '리워드', 클라이언트 ID는 예시로 채워둠. 나머지는 빈칸.
    const sampleRow = ['리워드', '-', '1', '예시 키워드', '예시 메인키워드', '', '', '2000-01-01', '2000-01-01', '', ''];
    const sheetData = [headers, sampleRow];

    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

    // 스타일 적용 (헤더)
    for (let colIdx = 0; colIdx < headers.length; colIdx++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
      const cell = sheet[cellAddress];
      if (cell) {
        cell.s = {
          alignment: { wrapText: true, vertical: 'top' },
          font: { name: '맑은 고딕', sz: 11 }
        };
      }
    }

    // 컬럼 너비 설정
    sheet['!cols'] = headers.map((h) => {
      if (h === '클라이언트 ID') return { wch: 30 };
      if (h === '상품 링크' || h === '가격비교링크' || h === '상품 URL') return { wch: 60 };
      if (h === '검색어') return { wch: 30 };
      if (h === '상품 이미지 URL') return { wch: 60 };
      if (h === '상품 가격') return { wch: 15 };
      return { wch: 20 };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, '엑셀양식');
    XLSX.writeFile(workbook, '타겟마케팅_엑셀_양식.xlsx');
  };




  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        setUploadedData(jsonData);
        setIsExcelUpload(true);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsArrayBuffer(file);


  };

  const handleApplyExcelData = async (uploadedData: any[]) => {
  if (!uploadedData || uploadedData.length === 0) return alert('엑셀 데이터가 없습니다.');
  for (const row of uploadedData) { // url 유효성 검사
    const singleLink = row[headerMapKeyword["상품 링크"]]
    if ((!singleLink )&& row[headerMapKeyword["슬롯 번호"]] == null) {
      alert("상품 링크가 비어있습니다.");
      return;  // brand. 가 없으면 함수 종료 또는 해당 행 처리 중단
    }
  }

  for (const row of uploadedData) {

    const slotSeq = row[headerMapKeyword["슬롯 번호"]]
    const keyword = row[headerMapKeyword["키워드"]]
    // const singleLink = row[headerMapKeyword["단일 링크"]]
    const landingUrl =  row[headerMapKeyword["랜딩 URL"]]
    const startDate = row[headerMapKeyword["시작 날짜"]];
    const endDate = row[headerMapKeyword["종료 날짜"]];





    let seq = -1;
    const brandPayload: any = {
        slotSeq: slotSeq,

        keyword: keyword,
        landingUrl: landingUrl,
        startDate: startDate,
        endDate: endDate,
    };
    const params = new URLSearchParams(brandPayload).toString();
    try {
      const res = await fetch(`/api/slots/brand?${params}`, {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
      });

      const json = await res.json();
      const { data } = json;

      if(data.length ==0){
        alert("일치하는 슬롯이 없습니다.");
        return;
      }else{
        seq = data[0].seq;
      }

    } catch (err) {
      console.error('에러 발생:', err);
    }



    // 각 항목을 필요에 따라 변환
    const updatePayload: any = {
    };
    updatePayload.seq = seq;

   


    try {
      const res = await fetch('/api/slots/brand', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatePayload),
      });

      alert("성공적으로 수정하였습니다.");
      if (window.opener) {
        window.opener.location.reload(); // 부모 창 새로고침
      }
      window.close();
      return;
    } catch (error) {
      console.error(`슬롯 ${seq} 수정 중 오류 발생`, error);
    }

    seq = -1;
  }
};

  // 클라이언트 ID 전용 업로드 처리: '클라이언트 ID' 컬럼만 읽고 /api/users에서 매칭하여 부모 창으로 전달
  const handleApplyExcelDataClient = async (uploadedData: any[]) => {
    if (!uploadedData || uploadedData.length === 0) return alert('엑셀 데이터가 없습니다.');

    const firstRow = uploadedData[0] || {};
    const clientKey = Object.keys(firstRow).find(k => k && k.toString().includes('클라이언트'));
    if (!clientKey) return alert('엑셀에 "클라이언트 ID" 컬럼이 필요합니다.');

    const firstRowKeys = Object.keys(firstRow);

    // transform uploadedData into rows matching server expected keys
    const rowsToSend = uploadedData.map((r) => {
      const map: any = {};
      // prefer exact keys if present
      map['타입'] = r['타입'] ?? r['타입'] ?? '';
      map['총판 ID'] = r['총판 ID'] ?? r['총판 ID'] ?? '';
      map['대행 ID'] = r['대행 ID'] ?? r['대행 ID'] ?? '';
      map['클라이언트 ID'] = r['클라이언트 ID'] ?? r['클라이언트'] ?? r['클라이언트 id'] ?? r['ClientId'] ?? '';
      map['개수'] = r['개수'] ?? r['count'] ?? r['개수'] ?? 1;
      map['키워드'] = r['키워드'] ?? r['검색어'] ?? '';
      map['메인 키워드'] = r['메인 키워드'] ?? r['메인키워드'] ?? r['mainKeyword'] ?? '';
      map['상품 링크'] = r['상품 링크'] ?? r['상품 URL'] ?? '';
      map['가격비교링크'] = r['가격비교링크'] ?? r['가격비교 링크'] ?? '';
      map['MID'] = r['MID'] ?? '';
      // accept either '시작일' or '시작 날짜'
      map['시작일'] = r['시작일'] ?? r['시작 날짜'] ?? r['시작'] ?? '';
      map['종료일'] = r['종료일'] ?? r['종료 날짜'] ?? r['종료'] ?? '';
      map['메모'] = r['메모'] ?? r['memo'] ?? '';
      return map;
    });

    // expand rows according to '개수' and validate
    const expandedRows: any[] = [];
    for (let i = 0; i < rowsToSend.length; i++) {
      const map = rowsToSend[i];
      const rawCount = map['개수'];
      if (rawCount === undefined || rawCount === null || rawCount === '') {
        Swal.fire('오류', `행 ${i + 1}: 개수(개수) 값이 비어있습니다.`, 'error');
        return;
      }
      const count = parseInt(String(rawCount), 10);
      if (isNaN(count) || count <= 0) {
        Swal.fire('오류', `행 ${i + 1}: 개수는 양의 정수여야 합니다.`, 'error');
        return;
      }
      for (let k = 0; k < count; k++) {
        expandedRows.push({ ...map });
      }
    }

    try {
      const res = await fetch('/api/slots/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(expandedRows),
      });

      if (!res.ok) {
        const { error } = await res.json();
        Swal.fire('업로드 실패', error || '서버 에러', 'error');
        return;
      } else {
        const result = await res.json();
        Swal.fire('업로드 완료', `${result.inserted || 0}건 추가되었습니다.`, 'success');
        if (window.opener) window.opener.postMessage({ type: 'excel-upload-result', data: result }, window.location.origin);
      }
    } catch (err) {
      console.error('업로드 에러:', err);
      Swal.fire('업로드 오류', '업로드 중 오류가 발생했습니다.', 'error');
    }

  };

  return (
    <>
      <div className="min-h-screen items-center bg-white p-6 text-left">
        <h1 className="text-2xl font-bold mb-6 text-center">엑셀 업로드</h1>
        <button
          type="button"
          className="inline-flex items-center justify-center bg-[#282828] hover:bg-[#141414] text-white px-6 py-3 rounded text-lg mr-2"
          onClick={downloadExcelTemplate}
        >
          엑셀 양식 다운로드
        </button>
        <label
          className="inline-flex items-center justify-center cursor-pointer bg-[#E5E7EB] text-gray-800 hover:bg-gray-300 px-6 py-3 rounded text-lg"
        >
          엑셀 파일 업로드
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        {uploadedData.length > 0 && (
          <div className="mt-6 w-full max-w-nonetext-sm text-left overflow-auto">
            <h2 className="font-semibold mb-2">미리보기</h2>
            <table className="table-auto min-w-[900px] border">
              <thead>
                <tr>
                  {Object.keys(uploadedData[0] || {}).map((key) => (
                    <th key={key} className="border px-2 py-1 bg-gray-100 text-left">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedData.length === 0 ? (
                  <tr>
                    <td className="p-2">데이터가 없습니다.</td>
                  </tr>
                ) : (
                  uploadedData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(row).map((key) => (
                        <td key={key} className="border px-2 py-1">
                          {(() => {
                            const cell = row[key];
                            if (cell === null || cell === undefined || cell === '') return '';
                            const lower = key.toString();
                            if (lower.includes('시작') || lower.includes('종료') || lower.toLowerCase().includes('start') || lower.toLowerCase().includes('end')) {
                              const d = parseExcelDate(cell);
                              return d ? d.toISOString().slice(0, 10) : String(cell);
                            }
                            return String(cell);
                          })()}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex flex-col">
              <button
                className="inline-block self-start bg-[#282828] hover:bg-[#141414] text-white px-6 py-3 rounded text-lg mr-2  mb-2"
                onClick={async () => {
                  await handleApplyExcelDataClient(uploadedData);
                }}
              >
                슬롯 업로드
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
