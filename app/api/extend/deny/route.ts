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

// DELETE - 연장 거절 (단일 및 일괄 거절)
export async function DELETE(request: Request) {
  const isSameDate = (date1:any, date2:any) => { 
    return date1.getFullYear() === date2.getFullYear() 
    && date1.getMonth() === date2.getMonth() 
    && date1.getDate() === date2.getDate(); 
  }  //동일날짜 비교

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { role } = currentUser;

    if (role != 0 && role != 1) { // 관리자 아닐경우
      return NextResponse.json({ error: '권한 없음' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Request body가 필요합니다.' }, { status: 400 });
    }
    const { seq, seqs } = body;

    if (seq) {
      await pool.query('UPDATE Extend set checked = false WHERE seq = ?', [seq]);
    } else if (Array.isArray(seqs) && seqs.length > 0) {
      const placeholders = seqs.map(() => '?').join(',');
      await pool.query(`UPDATE Extend set checked = false WHERE seq IN (${placeholders})`, seqs);
    } else {
      return NextResponse.json({ error: '삭제할 seq 또는 seqs가 필요합니다.' }, { status: 400 });
    }

    return NextResponse.json({ message: '연장 거절 완료' }); 
  } catch (error: any) {
    console.error('연장 거절 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
