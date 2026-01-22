// /app/api/slots/route.ts
import { NextResponse } from 'next/server';
import pool from 'lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ResultSetHeader } from 'mysql2';
import { setDefaultAutoSelectFamily } from 'net';

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

// GET - 슬롯 목록 조회 (검색 + 필터 + 페이지네이션)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { seq, role } = currentUser;
    const { searchParams } = new URL(request.url);

    const slotSeq = searchParams.get('slotSeq') || '';
    const keyword = searchParams.get('keyword') || searchParams.get('search') || '';
    const singleLink = searchParams.get('singleLink') || '';

    const params: any[] = [];
    let whereClause = 'WHERE 1=1';

    if (role === 1) {
      whereClause += ' AND (u.distributorId = ? OR u.agencyId = ? OR u.seq = ?)';
      params.push(seq, seq, seq);
    } else if (role === 2) {
      whereClause += ' AND (u.agencyId = ? OR u.seq = ?)';
      params.push(seq, seq);
    } else if (role === 3) {
      whereClause += ' AND u.seq = ?';
      params.push(seq);
    }
    if(slotSeq !=null && slotSeq !== '' && !isNaN(Number(slotSeq))){ //슬롯Seq가 존재시
      whereClause += ` AND (
        s.seq = ? 
      )`;
      params.push(
        `${Number(slotSeq)}`,
      );

    }else{
      if (keyword) {
        whereClause += ` AND (
          s.keyword = ? 
        )`;
        params.push(
          `${keyword}`,
        );
      }

      if (singleLink !== undefined) {
        if (singleLink === null || singleLink.trim() === "") {
          // null 또는 빈 문자열인 경우
          whereClause += ` AND (s.singleLink IS NULL OR s.singleLink = '')`;
        } else {
          // 값이 있는 경우
          whereClause += ` AND (s.singleLink = ?)`;
          params.push(singleLink);
        }
      }
    }


    whereClause += ` AND (s.singleLink  LIKE '%brand.%')`;
    whereClause += ' AND s.endDate >= CURDATE()'; // 만료 슬롯 제외

    let fromClause = `
      FROM Slot s
      LEFT JOIN \`User\` u ON s.userId = u.seq
      LEFT JOIN \`User\` a ON s.agencyId = a.seq
      LEFT JOIN \`User\` d ON s.distributorId = d.seq
    `;

    const [slots] = await pool.query<any[]>(
      `SELECT 
        s.seq, 
        s.createdAt,
        CONCAT(u.id, '\n(', u.name, ')') AS userId,
        CONCAT(a.id, '\n(', a.name, ')') AS agencyId,
        CONCAT(d.id, '\n(', d.name, ')') AS distributorId,
        s.keyword, 
        s.startDate, 
        s.endDate, 
        s.rank,
        s.memo,
        s.singleLink,
        s.errMsg,
        
      ${fromClause}
      ${whereClause}
      ORDER BY s.seq DESC
      `,
      [...params, ]
    );


    // ✅ 날짜 KST(+9시간) 변환 함수
    const convertToKSTDate = (utcDate: string) => {
      const date = new Date(utcDate);
      const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      return kst.toISOString().split('T')[0]; // "YYYY-MM-DD"
    };

    // ✅ 모든 startDate, endDate를 KST 기준 문자열로 변환
    const convertedRows = (slots as any[]).map(row => ({
      ...row,
      startDate: row.startDate ? convertToKSTDate(row.startDate) : null,
      endDate: row.endDate ? convertToKSTDate(row.endDate) : null,
    }));

    return NextResponse.json({ data: convertedRows});

  } catch (error: any) {
    console.error('슬롯 목록 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
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
    const { seq, productPrice,storeName,thumbnail} = body;



    if(!seq || isNaN(Number(seq))){
       return NextResponse.json({ error: '수정할 슬롯 ID 목록이 없습니다.' }, { status: 400 });
    }

  
    const [rows] = await pool.query<any[]>(
      `SELECT seq, keyword, singleLink FROM Slot WHERE seq =?`,
      seq
    );
    
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: '해당 슬롯 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

 
    // 동적으로 SET 절 구성
    const fields: string[] = [];
    const values: any[] = [];


    if (storeName !== undefined) {
      fields.push('thumbnail= ?');
      values.push(thumbnail);
    }


    values.push(seq);

    

    const setClause = fields.join(', ');


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

