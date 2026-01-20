'use client';

import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx-js-style';

interface Slot {
  seq: number;
  userId: string;
  agencyId: string;
  distributorId: string;
  productLink: string;
  keyword: string;
  startDate: string;
  endDate: string;
  productId: string | null;
  vendorId: string | null;
  thumbnail: string;
  rank: string;
  memo: string;
  sortation : number;
  secretKey1 : string;
  secretKey2 : string;
  secretKey3 : string;
  secretKey4 : string;
  secretLandingKey1 : string;
  secretLandingKey2 : string;
  secretLandingKey3 : string;
  secretLandingKey4 : string;
  singleLink : string;
  status: boolean;
  createdAt: string;
  errMsg: string;
  sceretKeyLinkType1: number|null;
  sceretKeyLinkType2: number|null;
  sceretKeyLinkType3: number|null;
  sceretKeyLinkType4: number|null;
  keywordLimit: number;
  comparePriceLowestPrice: number;
  comparePriceURL: string;
  comparePriceSalePlaceCount: number;
}


 const headerMapKeyword: Record<string, string> = {
      "슬롯번호": "슬롯번호",
      "상점명": `상점 명\n(공백 포함 최대 10자까지 노출)\n※ 다음 단어 포함 시 소재 비활성화: 등상품, 위상품, 구매, !, ~, #, 펼치기, 찜하기, 상세, 장바구니, 사러가기클릭, 등클릭, 번째클릭, 스토어클릭, 상품클릭, 클릭+찜`,
      "랜딩 URL": "랜딩 URL\n아래 6가지 중 택 1\n\n1. https://naver.com\n\n2. https://m.naver.com\n\n3. https://msearch.shopping.naver.com\n\n4. https://search.shopping.naver.com/home\n\n5. https://search.shopping.naver.com/ns\n\n6. https://app.shopping.naver.com/bridge",
      "시작 날짜": "시작 날짜\nYYYY-MM-DD",
      "종료 날짜": "종료 날짜\nYYYY-MM-DD",
      "목표 트래픽 수": "목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)",
      "아웃랜딩 여부": "아웃랜딩 여부\n\"Y\" 만 입력",
      "검색어": "검색어\n유저가 검색할 키워드를 입력해주세요.",
      "정답 태그 목록": "정답 태그 목록\n유저가 눌러야 하는 상품 페이지의 관련 태그를 모두 입력해주세요.",
      "상품 이미지 URL": "상품 이미지 URL\n유저가 눌러야 하는 상품의 대표 이미지 링크를 입력해주세요. \n검색 결과에 노출되는 이미지와 동일해야 해요.",
      "상품 가격": "상품 가격\n눌러야 하는 상품의 가격을 똑같이 입력해주세요.\n검색 결과에 노출되는 가격과 동일해야 해요.",
      "상품 ID": "상품 ID\n상품 상세 페이지의 ID를 입력해주세요.",
      "상품 URL": "상품 URL\n상품 상세 페이지의 URL를 입력해주세요.",
    };

    const headerMapKeywordMulti: Record<string, string> = {
      "슬롯번호": "슬롯번호",
      "상점명": `상점 명\n(공백 포함 최대 10자까지 노출)\n※ 다음 단어 포함 시 소재 비활성화: 등상품, 위상품, 구매, !, ~, #, 펼치기, 찜하기, 상세, 장바구니, 사러가기클릭, 등클릭, 번째클릭, 스토어클릭, 상품클릭, 클릭+찜`,
      "랜딩 URL": "랜딩 URL\n아래 6가지 중 택 1\n\n1. https://naver.com\n\n2. https://m.naver.com\n\n3. https://msearch.shopping.naver.com\n\n4. https://search.shopping.naver.com/home\n\n5. https://search.shopping.naver.com/ns\n\n6. https://app.shopping.naver.com/bridge",
      "시작 날짜": "시작 날짜\nYYYY-MM-DD",
      "종료 날짜": "종료 날짜\nYYYY-MM-DD",
      "목표 트래픽 수": "목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)",
      "아웃랜딩 여부": "아웃랜딩 여부\n\"Y\" 만 입력",
      "가격 비교 최저가": "가격 비교 최저가\n가격 비교 최저가를 입력해주세요. 상품 가격이 아니에요",
      "가격 비교 이미지": "가격 비교 이미지\n가격 비교 대표 상품 이미지 URL을 입력해주세요",
      "가격 비교 판매처 수": "가격 비교 판매처 수\n가격 비교 판매처 수를 입력해주세요",
      "상품 가격": "상품 가격\n상품 가격을 입력해주세요",
      "상품 이미지 URL": "상품 이미지\n상품 이미지를 입력해주세요",
      "검색어": "검색어\n검색어를 입력해주세요. 검색 후 랜딩되는 페이지에 상품이 보이지 않으면 소재가 종료될 수 있어요.",
      "정답 태그 목록": "정답 태그 목록\n정답 태그 목록을 입력해주세요",
    };
    
    const headerMapLanding: Record<string, string> = {
      "슬롯번호": "슬롯번호",
      '상점명': '상점명\n공백 포함 최대 10자까지 노출',
      '랜딩 URL': '랜딩 URL\n상품이 검색된 페이지 혹은 상품이 보이는 페이지를 세팅해주세요.',
      '시작 날짜': '시작 날짜\nYYYY-MM-DD',
      '종료 날짜': '종료 날짜\nYYYY-MM-DD',
      '목표 트래픽 수': '목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)',
      '아웃랜딩 여부': '아웃랜딩 여부\n"Y" 만 입력',
      '정답 태그 목록': '정답 태그 목록\n유저가 눌러야 하는 상품 페이지의 관련 태그를 모두 입력해주세요.',
      '상품 이미지 URL': '상품 이미지 URL\n유저가 눌러야 하는 상품의 대표 이미지 링크를 입력해주세요. \n검색 결과에 노출되는 이미지와 동일해야 해요.',
      '상품 가격': '상품 가격\n눌러야 하는 상품의 가격을 똑같이 입력해주세요.\n검색 결과에 노출되는 가격과 동일해야 해요.',
      '상품 ID': '상품 ID\n상품 상세 페이지의 ID를 입력해주세요.',
      '상품 URL': '상품 URL\n상품 상세 페이지의 URL를 입력해주세요.',
    };

    
    const headerMapLandingMulti: Record<string, string> = {
      "슬롯번호": "슬롯번호",
      '상점명': '상점명\n공백 포함 최대 10자까지 노출',
      '랜딩 URL': '랜딩 URL\n상품이 검색된 페이지 혹은 상품이 보이는 페이지를 세팅해주세요.',
      '시작 날짜': '시작 날짜\nYYYY-MM-DD',
      '종료 날짜': '종료 날짜\nYYYY-MM-DD',
      '목표 트래픽 수': '목표 트래픽 수\n소재 별로 유입되길 희망하는 목표 트래픽 수를 입력해주세요 (ex. 1000)',
      '아웃랜딩 여부': '아웃랜딩 여부\n"Y" 만 입력',
      '가격 비교 최저가': '가격 비교 최저가\n가격 비교 최저가를 입력해주세요. 상품 가격이 아니에요',
      '가격 비교 이미지': '가격 비교 이미지\n가격 비교 대표 상품 이미지 URL을 입력해주세요',
      '가격 비교 판매처수': '가격 비교 판매처 수\n가격 비교 판매처 수를 입력해주세요',
      '상품 가격': '상품 가격\n눌러야 하는 상품의 가격을 똑같이 입력해주세요.\n검색 결과에 노출되는 가격과 동일해야 해요.',
      '상품 이미지 URL': '상품 이미지 URL\n유저가 눌러야 하는 상품의 대표 이미지 링크를 입력해주세요. \n검색 결과에 노출되는 이미지와 동일해야 해요.',
      '정답 태그 목록': '정답 태그 목록\n유저가 눌러야 하는 상품 페이지의 관련 태그를 모두 입력해주세요.',
    };

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

     Swal.fire({
              title: '엑셀 옵션을 선택해주세요',
                  html: `
                  <div style="display: flex; gap: 20px; justify-content: center; flex-direction: column; align-items: center;">
                    <div>
                      <label><input type="radio" name="option" value="1"> 키워드 단일</label>
                      <label><input type="radio" name="option" value="2"> 키워드 원부</label>
                      <label><input type="radio" name="option" value="3"> 랜딩 단일</label>
                      <label><input type="radio" name="option" value="4"> 랜딩 원부</label>
                    </div>
                  </div>
                `,
    
              showCancelButton: true,
              confirmButtonText: '확인',
              cancelButtonText: '취소',
              preConfirm: () => {
                    const selected = document.querySelector<HTMLInputElement>('input[name="option"]:checked');
                    if (!selected) {
                      Swal.showValidationMessage('옵션을 선택해주세요.');
                      return;
                    }
                 
   
                  return {
                     selectedOption: selected.value,
            
                  };
              }
            }).then((result) => { // 확인시

              if(result.isConfirmed){
                if(result.value.selectedOption == "1"){
                  const headers = Object.entries(headerMapKeyword);
                  const sheetData = [headers.map(([_, desc]) => desc)];

                  const sheet = XLSX.utils.aoa_to_sheet(sheetData);

                  headers.forEach((_, colIdx) => {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                    const cell = sheet[cellAddress];
                    if (cell) {
                      cell.s = {
                        alignment: { wrapText: true, vertical: 'top' },
                        font: { name: '맑은 고딕', sz: 11 }
                      };
                    }
                  });

                  sheet['!cols'] = headers.map(() => ({ wch: 60 }));

                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, sheet, '엑셀양식');
                  XLSX.writeFile(workbook, '슬롯_엑셀_양식_키워드_단일.xlsx');
                }else if(result.value.selectedOption=="2"){
                  if(result.value.selectedOption == "1"){
                    const headers = Object.entries(headerMapKeywordMulti);
                    const sheetData = [headers.map(([_, desc]) => desc)];

                    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

                    headers.forEach((_, colIdx) => {
                      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                      const cell = sheet[cellAddress];
                      if (cell) {
                        cell.s = {
                          alignment: { wrapText: true, vertical: 'top' },
                          font: { name: '맑은 고딕', sz: 11 }
                        };
                      }
                    });

                    sheet['!cols'] = headers.map(() => ({ wch: 60 }));

                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, sheet, '엑셀양식');
                    XLSX.writeFile(workbook, '슬롯_엑셀_양식_키워드_원부.xlsx');
                  }
                }else if(result.value.selectedOption=="3"){
                 
                    const headers = Object.entries(headerMapLanding);
                    const sheetData = [headers.map(([_, desc]) => desc)];

                    const sheet = XLSX.utils.aoa_to_sheet(sheetData);

                    headers.forEach((_, colIdx) => {
                      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                      const cell = sheet[cellAddress];
                      if (cell) {
                        cell.s = {
                          alignment: { wrapText: true, vertical: 'top' },
                          font: { name: '맑은 고딕', sz: 11 }
                        };
                      }
                    });

                    sheet['!cols'] = headers.map(() => ({ wch: 60 }));
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, sheet, '엑셀양식');
                    XLSX.writeFile(workbook, '슬롯_엑셀_양식_랜딩_단일.xlsx');
                  
                }else if(result.value.selectedOption=="4"){
                  const headers = Object.entries(headerMapLandingMulti);
                  const sheetData = [headers.map(([_, desc]) => desc)];

                  const sheet = XLSX.utils.aoa_to_sheet(sheetData);

                  headers.forEach((_, colIdx) => {
                    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
                    const cell = sheet[cellAddress];
                    if (cell) {
                      cell.s = {
                        alignment: { wrapText: true, vertical: 'top' },
                        font: { name: '맑은 고딕', sz: 11 }
                      };
                    }
                  });

                  sheet['!cols'] = headers.map(() => ({ wch: 60 }));

                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, sheet, '엑셀양식');
                  XLSX.writeFile(workbook, '슬롯_엑셀_양식_랜딩_원부.xlsx');
                }
              }
          });
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
    const singleLink = row[headerMapKeyword["단일 링크"]]
    if ((!singleLink || !singleLink.includes("brand."))&& row[headerMapKeyword["슬롯 번호"]] == null) {
      alert("단일 링크가 비어있거나, 브랜드 URL이 아닌 데이터가 있습니다.");
      return;  // brand. 가 없으면 함수 종료 또는 해당 행 처리 중단
    }
  }

  for (const row of uploadedData) {

    const slotSeq = row[headerMapKeyword["슬롯 번호"]]
    const keyword = row[headerMapKeyword["키워드"]]
    // const singleLink = row[headerMapKeyword["단일 링크"]]
    // const productLink = row[headerMapKeyword["원부 링크"]]
    const landingUrl =  row[headerMapKeyword["랜딩 URL"]]
    const startDate = row[headerMapKeyword["시작 날짜"]];
    const endDate = row[headerMapKeyword["종료 날짜"]];
    const trapic = row[headerMapKeyword["목표 트래픽 수"]];
    const isOutLanding = row[headerMapKeyword["아웃랜딩 여부"]];
    const secretKey1 = row[headerMapKeyword["검색어"]];
    const comparePriceLowestPrice = row[headerMapKeyword["가격 비교 최저가"]];
    const comparePriceURL = row[headerMapKeyword["가격 비교 이미지"]];
    const comparePriceSalePlaceCount = row[headerMapKeyword["가격 비교 판매처 수"]];
    const productPrice = row[headerMapKeyword["상품 가격"]];
    const thumbnail = row[headerMapKeyword["상품 이미지 URL"]];
    


    let seq = -1;
    const brandPayload: any = {
        slotSeq: slotSeq,
        
        keyword: keyword,
        landingUrl: landingUrl,
        startDate: startDate,
        endDate: endDate,
        trapic: trapic,
        isOutLanding: isOutLanding,
        secretKey1: secretKey1,



        // singleLink: singleLink,
        // productLink: productLink,
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

    if (row[headerMapKeyword["스토어명"]]) {
      updatePayload.storeName = row[headerMapKeyword["스토어명"]];
    }
    if (row[headerMapKeyword["썸네일"]]) {
      updatePayload.thumbnail = row[headerMapKeyword["썸네일"]];
    }
    if (row[headerMapKeyword["상품 가격"]]) {
      updatePayload.productPrice = Number(row[headerMapKeyword["상품 가격"]]);
    }
    if (row[headerMapKeyword["정답 태그 목록"]]) {
      updatePayload.answerTagList = row[headerMapKeyword["정답 태그 목록"]];
    }

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

  return (
    <div className="min-h-screen items-center bg-white p-6 text-left">
      <h1 className="text-2xl font-bold mb-6 text-center">엑셀 업로드</h1>
      <button
        className="bg-[#6449FC] hover:bg-[#5a3ee0] text-white px-6 py-3 rounded text-lg mr-2"
        onClick={downloadExcelTemplate}
      >
        엑셀 양식 다운로드
      </button>
      <label className="cursor-pointer bg-[#E5E7EB] text-gray-800 hover:bg-gray-300 px-6 py-3 rounded text-lg">
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
            <h2 className="font-semibold mb-2">업로드된 데이터 미리보기</h2>
            <table className="table-auto min-w-[900px] border">
              <thead>
                <tr>
                  {/* uploadedData의 첫 행의 키들을 헤더로 사용 */}
                  {Object.keys(uploadedData[0]).map((key) => (
                    <th key={key} className="border px-2 py-1 bg-gray-100">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadedData.length === 0 ? (
                  <tr>
                    <td colSpan={Object.keys(uploadedData[0]).length} className="text-center py-4 text-gray-500">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  uploadedData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.keys(row).map((key) => (
                        <td key={key} className="border px-2 py-1">
                          {row[key] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex flex-col">
              <button
                className="inline-block self-start bg-[#6449FC] hover:bg-[#5a3ee0] text-white px-6 py-3 rounded text-lg mr-2  mb-2"
                onClick={async () => {
                  await handleApplyExcelData(uploadedData);
                }}
              >
                슬롯 수정
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
