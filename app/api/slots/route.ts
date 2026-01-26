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
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');

    const keyword = searchParams.get('keyword') || searchParams.get('search') || '';

    const rankOption =  Number(searchParams.get('rankOption') || '0');

    
    const slotSearchType=  Number(searchParams.get('slotSearchType') || '1');

    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * pageSize;

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

    if (keyword) {
      whereClause += ` AND (
        s.keyword LIKE ? OR
        u.id LIKE ? OR 
        s.singleLink LIKE ? OR
        s.comparePriceLink LIKE ? OR
        s.mid LIKE ?
      )`;
      params.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`
      );
    }

    if (userId) {
      whereClause += ' AND u.seq = ?';
      params.push(userId);
    }

    if (startDate) {
      whereClause += ' AND s.startDate >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND s.endDate <= ?';
      params.push(endDate);
    }
    whereClause += ' AND s.endDate >= CURDATE()'; // 만료 슬롯 제외
    //검색타입
    if(slotSearchType !=0){// 전체
        if(slotSearchType ==1){  //정상
          whereClause += ` AND DATE_SUB(s.startDate, INTERVAL 1 DAY) <= CURDATE() AND s.endDate >= CURDATE() 
            AND s.keyword IS NOT NULL AND s.keyword <> ''
            AND s.singleLink IS NOT NULL AND s.singleLink <> ''
            AND s.mid IS NOT NULL AND s.mid <> ''
            AND sr.seq IS NOT NULL`;
        }else if(slotSearchType ==2){ //오류
          whereClause += ` AND (s.keyword IS NULL OR s.keyword = '' 
                        OR s.singleLink IS NULL OR s.singleLink = '' 
                        OR s.mid IS NULL OR s.mid = ''
                        OR sr.seq IS NULL)`;
        }else if (slotSearchType == 3){ //대기
          whereClause += `
              AND s.rank IS NULL
              AND NOT (
                 (s.singleLink IS NOT NULL)
              )
            `;
        }
        else if (slotSearchType == 4){ //마감예정
          whereClause += ' AND s.endDate = CURDATE() ';
        }
    }

    let fromClause = `
      FROM Slot s
      LEFT JOIN \`User\` u ON s.userId = u.seq
      LEFT JOIN \`User\` a ON s.agencyId = a.seq
      LEFT JOIN \`User\` d ON s.distributorId = d.seq
      LEFT JOIN (
        SELECT keyword, singleLink, MAX(seq) as seq
        FROM slot_ranking
        WHERE DATE(created) = CURDATE()
        GROUP BY keyword, singleLink
      ) sr ON s.keyword = sr.keyword AND s.singleLink = sr.singleLink
    `;

    if(rankOption == 1){
      fromClause += `
        JOIN (
          WITH RankedSlot AS (
            SELECT
              sr.singleLink,
              sr.keyword,
              sr.ranking,
              DATE(sr.created) AS rankDate,
              sr.created,
              ROW_NUMBER() OVER (
                PARTITION BY sr.singleLink, sr.keyword, DATE(sr.created)
                ORDER BY sr.created DESC
              ) AS rn
            FROM slot_ranking sr
          )
          SELECT
            today.singleLink,
            today.keyword
          FROM RankedSlot today
          JOIN RankedSlot yesterday
            ON today.singleLink <=> yesterday.singleLink
            AND today.keyword <=> yesterday.keyword
          WHERE
            today.rn = 1
            AND yesterday.rn = 1
            AND DATE(today.rankDate) = CURDATE()
            AND DATE(yesterday.rankDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND (today.ranking+0) < (yesterday.ranking+0)
        ) rankFilter
        ON (
          (s.singleLink = rankFilter.singleLink OR (s.singleLink IS NULL AND rankFilter.singleLink IS NULL))
          AND
          (s.keyword = rankFilter.keyword OR (s.keyword IS NULL AND rankFilter.keyword IS NULL))
        )
      `;
    }else if(rankOption == -1){
      fromClause += `
        JOIN (
          WITH RankedSlot AS (
            SELECT
              sr.singleLink,
              sr.keyword,
              sr.ranking,
              DATE(sr.created) AS rankDate,
              sr.created,
              ROW_NUMBER() OVER (
                PARTITION BY sr.singleLink, sr.keyword, DATE(sr.created)
                ORDER BY sr.created DESC
              ) AS rn
            FROM slot_ranking sr
          )
          SELECT
            today.singleLink,
            today.keyword
          FROM RankedSlot today
          JOIN RankedSlot yesterday
            ON today.singleLink <=> yesterday.singleLink
            AND today.keyword <=> yesterday.keyword
          WHERE
            today.rn = 1
            AND yesterday.rn = 1
            AND DATE(today.rankDate) = CURDATE()
            AND DATE(yesterday.rankDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND (today.ranking+0) > (yesterday.ranking + 0)
        ) rankFilter
        ON (
          (s.singleLink = rankFilter.singleLink OR (s.singleLink IS NULL AND rankFilter.singleLink IS NULL))
          AND
          (s.keyword = rankFilter.keyword OR (s.keyword IS NULL AND rankFilter.keyword IS NULL))
        )
      `;
    }


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
        s.comparePriceLink,
        s.errMsg,
        s.mid,
        IF(sr.seq IS NOT NULL, 1, 0) as hasRanking
      ${fromClause}
      ${whereClause}
      ORDER BY s.seq DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
      ${fromClause}
       ${whereClause}`,
      params
    );

    const total = (countRows as any)[0].total;

    const totalPages = Math.ceil(total / pageSize);



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

    return NextResponse.json({ data: convertedRows, totalPages });

  } catch (error: any) {
    console.error('슬롯 목록 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
}



// POST - 슬롯 추가
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
  
    const slots = await request.json();
    const values: any[] = [];

    for (const slot of slots) {
      const [userRows] = await pool.query(
        `SELECT agencyId, distributorId FROM User WHERE seq = ? LIMIT 1`,
        [slot.userId]
      );


      const user = (userRows as any[])[0];
      if (!user) {
        return NextResponse.json({ error: `유저 정보가 없음: ${slot.userId}` }, { status: 404 });
      }

      values.push([
        slot.userId,
        user.agencyId || null,
        user.distributorId || null,
        slot.startDate,
        slot.endDate,
      ]);
    }
  
    const query = `
      INSERT INTO Slot (userId, agencyId, distributorId, startDate, endDate)
      VALUES ?
    `;
    
    const [result] = await pool.query<ResultSetHeader>(query, [values]);

    const logQuery = `
     INSERT INTO Log (type,created_at,agency,distributor,user,slot_seq,start_at,end_at,adjustment_day)
     VALUES ?
    `; // 로그 추가 

    const insertedIds = Array.from({ length: result.affectedRows }, (_, i) => result.insertId + i); //입력한 슬롯 seq 추출
    const [insertedSlots] = await pool.query<any[]>(
      `SELECT * FROM Slot WHERE seq IN (?) ORDER BY seq ASC`,
      [insertedIds]
    );
      
   
    const logValues: any[] = [];
    for (let i = 0; i < insertedSlots.length; i++) {
      const slot = insertedSlots[i];
      const insertedId = insertedIds[i];

      const adjustmentDay = Math.ceil(
        (new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      // 1. 사용자 정보 조회
      const [[user]] = await pool.query<any[]>(`
        SELECT role, distributorId,agencyId
        FROM User
        WHERE seq = ?
      `, [slot.userId]);

      


      // logValue 구성
      logValues.push([
        1,
        slot.createdAt,
        slot.agencyId || null,
        slot.distributorId || null,
        slot.userId,
        insertedId,
        slot.startDate,
        slot.endDate,
        adjustmentDay,
      ]);
    }
      
    const [logResult] = await pool.query(logQuery, [logValues]);

    return NextResponse.json({ message: '슬롯 추가 완료', result });
  } catch (error: unknown) {
    console.error('슬롯 추가 오류:', error);
    return NextResponse.json({ error: '슬롯 추가 중 오류 발생' }, { status: 500 });
  }
}

// PUT - 슬롯  수정
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }


    const body = await request.json();
    const { seqs, keyword, memo ,singleLink, mid, comparePriceLink} = body;

    if (!Array.isArray(seqs) || seqs.length === 0) {
      return NextResponse.json({ error: '수정할 슬롯 ID 목록이 없습니다.' }, { status: 400 });
    }



    const [rows] = await pool.query<any[]>(
      `SELECT seq, keyword, singleLink, memo, mid, comparePriceLink FROM Slot WHERE seq IN (${seqs.map(() => '?').join(',')})`,
      seqs
    );
    // 실제 수정할 값 계산
    let hasChanges = false;
    let onlyMemo = false;


    for (const row of rows) { //바뀐값 검사
      if (
        (keyword !== undefined && keyword !== row.keyword) ||
        (singleLink !== undefined && singleLink !== row.singleLink) ||
        (memo !== undefined && memo !== row.memo) ||
        (mid !== undefined && mid !== row.mid) ||
        (comparePriceLink !== undefined && comparePriceLink !== row.comparePriceLink)
      ) {
        hasChanges = true;
        break;
      }
    }

    for (const row of rows) { // 데이터 null 비초기화 조건 검사 
      const isSingleLinkSame = singleLink === undefined || singleLink === row.singleLink;
      const isDifferent = ((memo !== undefined && memo !== row.memo)  || (keyword !== undefined && keyword !== row.keyword) || (mid !== undefined && mid !== row.mid) || (comparePriceLink !== undefined && comparePriceLink !== row.comparePriceLink)); // 키워드 , 메모 동시 체크 
      if (
        isSingleLinkSame &&
        isDifferent
      ) {
        onlyMemo= true;
        break;
      }
    }
   
    if (!hasChanges) {
      return NextResponse.json({ message: '수정할 항목이 없습니다' }, { status: 200 });
    }  //바뀐게 없을경우


    // 동적으로 SET 절 구성
    const fields: string[] = [];
    const values: any[] = [];

 
    if (singleLink !== undefined) {
      fields.push('singleLink = ?');
      values.push(singleLink);
    }
    if (keyword !== undefined) {
      fields.push('keyword = ?');
      values.push(keyword);
    }
    if (memo !== undefined) {
      fields.push('memo = ?');
      values.push(memo);
    }
    if (mid !== undefined) {
      fields.push('mid = ?');
      values.push(mid);
    }
    if (comparePriceLink !== undefined) {
      fields.push('comparePriceLink = ?');
      values.push(comparePriceLink);
    }



    if(!onlyMemo){ // 값변동 있을경우 api 호출값 초기화 (메모만 수정될경우 미호출)
      fields.push('rank = ?');
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

    return NextResponse.json({ message: '일괄 수정 완료' });
  } catch (error: any) {
    console.error('슬롯 수정 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// DELETE - 슬롯 삭제 (단일 및 일괄 삭제)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { seq, seqs } = body;


    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
    const { role } = currentUser;

    if(role != 0){
      return NextResponse.json({ error: '관리자 외 삭제 불가' }, { status: 403 });
    }


    if (seq) {
      console.log('단일 삭제 seq:', seq);
      await pool.query('DELETE FROM Slot WHERE seq = ?', [seq]);
      
    } else if (Array.isArray(seqs) && seqs.length > 0) {
      console.log('일괄 삭제 seqs:', seqs);
      const placeholders = seqs.map(() => '?').join(',');
      await pool.query(`DELETE FROM Slot WHERE seq IN (${placeholders})`, seqs);


    } else {
      return NextResponse.json({ error: '삭제할 seq 또는 seqs가 필요합니다.' }, { status: 400 });
    }

    return NextResponse.json({ message: '삭제 완료' });
  } catch (error: any) {
    console.error('슬롯 삭제 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}