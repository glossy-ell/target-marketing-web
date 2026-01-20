// /app/api/slots/route.ts
import { NextResponse } from 'next/server';
import pool from 'lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';


// 유저 인증 - JWT 쿠키 기반
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return { seq: decoded.seq, role: decoded.role, id: decoded.id, };
  } catch (err) {
    return null;
  }
}


// PUT - 슬롯 다중 수정
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }


    const body = await request.json();
    const { seq, thumbnail,productPrice,answerTagList,storeName,productId,comparePriceLowestPrice,comparePriceURL,comparePriceSalePlaceCount } = body;
    



    if (!seq) {
      return NextResponse.json({ error: '수정할 슬롯 ID 목록이 없습니다.' }, { status: 400 });
    }


    const [rows] = await pool.query<any[]>(
      `SELECT seq, productLink, keyword, singleLink, status FROM Slot WHERE seq =?`,
      seq
    );

    if (rows.length === 0) {
        return NextResponse.json({ error: '일치하는 슬롯 없음' }, { status: 400 });
    } 

    const productLink = rows[0].productLink;

    // 동적으로 SET 절 구성
    const fields: string[] = [];
    const values: any[] = [];

    if (thumbnail !== undefined) {
      fields.push('thumbnail = ?');
      values.push(thumbnail);
    }

    if (productPrice !== undefined && productPrice !=0) {
      fields.push('productPrice = ?');
      values.push(Number(productPrice));
    }else{
      fields.push('productPrice = ?');
      values.push(null);
    }

    if (answerTagList !== undefined) {
      fields.push('answerTagList = ?');
      values.push(answerTagList);
    }
    if (storeName !== undefined) {
      fields.push('storeName = ?');
      values.push(storeName);
    }
    if (productId !== undefined) {
      fields.push('productId = ?');
      values.push(productId);
    }
     if (comparePriceLowestPrice !== undefined && productLink) {
      fields.push('comparePriceLowestPrice = ?');
      values.push(Number(comparePriceLowestPrice ));
    }
     if (comparePriceURL !== undefined && productLink) {
      fields.push('comparePriceURL = ?');
      values.push(comparePriceURL);
    }
     if (comparePriceSalePlaceCount !== undefined && productLink) {
      fields.push('comparePriceSalePlaceCount = ?');
      values.push(Number(comparePriceSalePlaceCount));
    }



  


    let check = 1;
    let errMsg = "";
    if(productLink){
      if(!thumbnail){
        errMsg+="상품 이미지 URL(값이 비어있음),";
        check = 0;
      }
      if(!productPrice  || Number(productPrice)==0){
        errMsg+="상품 가격(값이 비어있음),";
        check = 0;
      }
      if(!answerTagList){
        errMsg+="정답 태그 목록(값이 비어있음),";
        check = 0;
      }
      if(!storeName){
        errMsg+="상점명(값이 비어있음),";
        check = 0;
      }

      if(!productId){
        errMsg+="상품ID(값이 비어있음),";
        check = 0;
      }
      if(!comparePriceLowestPrice || comparePriceLowestPrice === "0"){
        errMsg+="가격 비교 최저가(값이 비어있음),";
        check = 0;
      }
      if(!comparePriceURL){
        errMsg+="가격 비교 이미지(값이 비어있음),";
        check = 0;
      }

      if(!comparePriceSalePlaceCount || comparePriceSalePlaceCount === "0"){
        errMsg+="가격 비교 판매처수(값이 비어있음),";
        check = 0;
      }
      if (errMsg.endsWith(',')) {
        errMsg = errMsg.slice(0, -1);
      }

    }else{
    if(!thumbnail){
        errMsg+="상품 이미지 URL(값이 비어있음),";
        check = 0;
      }
      if(!productPrice || Number(productPrice)==0){
        errMsg+="상품 가격(값이 비어있음),";
        check = 0;
      }
      if(!answerTagList){
        errMsg+="정답 태그 목록(값이 비어있음),";
        check = 0;
      }
      if(!storeName){
        errMsg+="상점명(값이 비어있음),";
        check = 0;
      }
      if(!productId){
        errMsg+="상품ID(값이 비어있음),";
        check = 0;
      }
      if (errMsg.endsWith(',')) {
        errMsg = errMsg.slice(0, -1);
      }
    }

    if(check==0){
      console.log('active');
      fields.push('errMsg = ?');
      values.push(errMsg);
      fields.push('status = ?');
      values.push(false);
    }
    else{
      fields.push('status = ?');
      values.push(true);
      fields.push('errMsg = ?');
      values.push(null);
    }
    const setClause = fields.join(', ');
    values.push(seq); 
    console.log(errMsg);
    console.log(check);
    console.log(seq);
    const query = `
      UPDATE Slot
      SET ${setClause}
      WHERE seq = ?
    `;

    await pool.query(query, values);
    

    return NextResponse.json({ message: '수정 완료' });
  } catch (error: any) {
    console.error('슬롯 수정 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

