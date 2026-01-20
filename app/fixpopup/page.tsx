'use client';
import { useState, useEffect } from 'react';

export default function FixPopupPage() {
  const [formData, setFormData] = useState({
    seq:'',
    thumbnail: '',
    productPrice: '',
    answerTagList: '',
    storeName: '',
    comparePriceLowestPrice: '',
    comparePriceURL: '',
    comparePriceSalePlaceCount: '',
    productId: ''
  });
  const [productLink,setProductLink] = useState<string>('');
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setFormData({
      seq: urlParams.get('seq') || '',
      thumbnail: urlParams.get('thumbnail') || '',
      productPrice: urlParams.get('productPrice') || '',
      answerTagList: urlParams.get('answerTagList') || '',
      storeName: urlParams.get('storeName') || '',
      comparePriceLowestPrice: urlParams.get('comparePriceLowestPrice') || '',
      comparePriceURL:  urlParams.get('comparePriceURL') || '',
      comparePriceSalePlaceCount: urlParams.get('comparePriceSalePlaceCount') || '',
      productId: urlParams.get('productId') || '',
    });
    setProductLink(urlParams.get('productLink') || '');
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
      try {

      const res = await fetch('/api/slots/edit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    
      if (!res.ok) {
         if(res.status===401){
          alert('세션이 만료되었습니다. 다시 로그인해주세요.');
          return;
        }
      
        else{
           throw new Error('저장 실패');
        }
      }
      
      alert('저장되었습니다.');
      if (window.opener && !window.opener.closed) {
        window.opener.location.reload();  // 부모 창 새로고침
      }
      window.close();
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-4">상품 정보 수정</h1>
      <table className="w-full border border-gray-300">
        <tbody>
          <tr>
            <td className="border p-2 bg-gray-100 w-40">상품 이미지 URL</td>
            <td className="border p-2">
              <input
                type="text"
                value={formData.thumbnail}
                onChange={(e) => handleChange('thumbnail', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder="이미지 URL을 입력하세요"
              />
            </td>
          </tr>
          <tr>
            <td className="border p-2 bg-gray-100">상품 가격</td>
            <td className="border p-2">
              <input
                type="number"
                value={formData.productPrice}
                onChange={(e) => handleChange('productPrice', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder=",없이 숫자만 입력해주세요. ex) 14000"
              />
            </td>
          </tr>
          <tr>
            <td className="border p-2 bg-gray-100">정답 태그 목록</td>
            <td className="border p-2">
              <input
                type="text"
                value={formData.answerTagList}
                onChange={(e) => handleChange('answerTagList', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder=", 로 구분해주세요 ex)남성,여성"
              />
            </td>
          </tr>
          <tr>
            <td className="border p-2 bg-gray-100">상점명</td>
            <td className="border p-2">
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder="스토어명을 작성해주세요"
              />
            </td>
          </tr>

          <tr>
            <td className="border p-2 bg-gray-100">상품ID</td>
            <td className="border p-2">
              <input
                type="text"
                value={formData.productId}
                onChange={(e) => handleChange('productId', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder="미드값을 작성해주세요."
              />
            </td>
          </tr>


           <tr
             style={{
              display: !productLink ? 'none' : '',
            }}
           >
            <td className="border p-2 bg-gray-100">가격 비교 최저가</td>
            <td className="border p-2">
              <input
                type="text"
                value={formData.comparePriceLowestPrice}
                onChange={(e) => handleChange('comparePriceLowestPrice', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder="가격 비교 최저가를 입력하세요"
              />
            </td>
          </tr>
           <tr  style={{
              display: !productLink ? 'none' : '',
            }}>
            <td className="border p-2 bg-gray-100">가격 비교 이미지</td>
            <td className="border p-2">
              <input
                type="text"
                value={formData.comparePriceURL}
                onChange={(e) => handleChange('comparePriceURL', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder="가격 비교 이미지를 입력하세요"
              />
            </td>
          </tr>
           <tr
             style={{
              display: !productLink ? 'none' : '',
            }}>
            <td className="border p-2 bg-gray-100">가격 비교 판매처 수</td>
            <td className="border p-2">
              <input
                type="text"
                value={formData.comparePriceSalePlaceCount}
                onChange={(e) => handleChange('comparePriceSalePlaceCount', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1"
                placeholder="가격 비교 판매처 수를 입력하세요"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => window.close()}
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          className="bg-[#6449FC] hover:bg-[#5a3ee0]  text-white px-4 py-2 rounded"
        >
          저장
        </button>
      </div>
    </div>
  );
}
