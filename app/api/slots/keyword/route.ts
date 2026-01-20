// /app/api/slots/route.ts
import { NextResponse } from 'next/server';
import pool from 'lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ResultSetHeader } from 'mysql2';
import { setDefaultAutoSelectFamily } from 'net';


//시크릿 키 /타입 설정 

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
    const body = await request.json();

    const { seqs, formData } = body;
    const {sortation, keyword,secretKey1, secretKey2, secretKey3,secretKey4,currentSort,secretLandingKey1,secretLandingKey2,secretLandingKey3,secretLandingKey4 
      ,sceretKeyLinkType1,sceretKeyLinkType2,sceretKeyLinkType3,sceretKeyLinkType4
    } = formData;
    if (!Array.isArray(seqs) || seqs.length === 0) {
      return NextResponse.json({ error: '수정할 슬롯 ID 목록이 없습니다.' }, { status: 400 });
    }
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
    
    // 동적으로 SET 절 구성
    const fields: string[] = [];
    const values: any[] = [];

    if (sortation == "1") {
      fields.push('sortation = ?');
      values.push(1);
    }else{
      fields.push('sortation = ?');
      values.push(2);
      fields.push('sceretKeyLinkType1 = ?');
      values.push(null);
      fields.push('sceretKeyLinkType2 = ?');
      values.push(null);
      fields.push('sceretKeyLinkType3 = ?');
      values.push(null);
      fields.push('sceretKeyLinkType4 = ?');
      values.push(null);
    }

    if (keyword) {
        fields.push('keyword = ?');
        values.push(keyword);
    }
        
      




    // if(currentSort != sortation && !secretKey1){
    //   fields.push('secretKey1 = ?');
    //   values.push(null);
    // }
    // if(currentSort != sortation && !secretKey2){
    //   fields.push('secretKey2 = ?');
    //   values.push(null);
    // }
    // if(currentSort != sortation && !secretKey3){
    //   fields.push('secretKey3 = ?');
    //   values.push(null);
    // }
    if (secretKey1) {
      fields.push('secretKey1 = ?');
      values.push(secretKey1);
    }else{
      fields.push('secretKey1 = ?');
      values.push(null);
    }


    if (secretKey2) {
      fields.push('secretKey2 = ?');
      values.push(secretKey2);
    }else{
      fields.push('secretKey2 = ?');
      values.push(null);
    }

    if (secretKey3) {
      fields.push('secretKey3 = ?');
      values.push(secretKey3);
    }else{
      fields.push('secretKey3 = ?');
      values.push(null);
    }

    if(secretKey4) {
      fields.push('secretKey4 = ?');
      values.push(secretKey4);
    }else{
      fields.push('secretKey4 = ?');
      values.push(null);
    }

    if(sceretKeyLinkType1 == 0 ) {
      fields.push('sceretKeyLinkType1 = ?');
      values.push(null);
    } else if (sceretKeyLinkType1) {
      fields.push('sceretKeyLinkType1 = ?');
      values.push(sceretKeyLinkType1);
    }
    

    if(sceretKeyLinkType2 == 0 ) {
      fields.push('sceretKeyLinkType2 = ?');
      values.push(null);
    }
    else if(sceretKeyLinkType2) {
      fields.push('sceretKeyLinkType2 = ?');
      values.push(sceretKeyLinkType2);
    }


    if(sceretKeyLinkType3 == 0 ) {
      fields.push('sceretKeyLinkType3 = ?');
      values.push(null);
    }
    else if(sceretKeyLinkType3) {
      fields.push('sceretKeyLinkType3 = ?');
      values.push(sceretKeyLinkType3);
    }


    if(sceretKeyLinkType4 == 0 ) {
      fields.push('sceretKeyLinkType4 = ?');
      values.push(null);
    }
    else if(sceretKeyLinkType4) {
      fields.push('sceretKeyLinkType4 = ?');
      values.push(sceretKeyLinkType4);
    }


    if (secretLandingKey1) {
      fields.push('secretLandingKey1 = ?');
      values.push(secretLandingKey1);
    }else {
      fields.push('secretLandingKey1 = ?');
      values.push(null);
    }

    if (secretLandingKey2) {
      fields.push('secretLandingKey2 = ?');
      values.push(secretLandingKey2);
    }else {
      fields.push('secretLandingKey2 = ?');
      values.push(null);
    }

    if(secretLandingKey3) {
      fields.push('secretLandingKey3 = ?');
      values.push(secretLandingKey3);
    }else{
      fields.push('secretLandingKey3 = ?');
      values.push(null);
    }

    if (secretLandingKey4) {
      fields.push('secretLandingKey4 = ?');
      values.push(secretLandingKey4);
    }else {
      fields.push('secretLandingKey4 = ?');
      values.push(null);
    }



    const setClause = fields.join(', ');
    const placeholders = seqs.map(() => '?').join(',');
    values.push(...seqs); // ID 목록도 마지막에 추가

    const query = `
      UPDATE Slot
      SET ${setClause}
      WHERE seq IN (${placeholders})
    `;

    await pool.query(query, values);

    return NextResponse.json({ message: '추가정보 수정 완료' });
  } catch (error: any) {
    console.error('슬롯 수정 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

