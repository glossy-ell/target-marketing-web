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

// GET - 연장 목록 조회 (검색 + 필터 + 페이지네이션)
export async function GET(request: Request) {

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { seq, role } = currentUser;

    if (role != 0 && role != 1) { // 관리자 아닐경우
      return NextResponse.json({ error: '권한 없음' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');

    const keyword = searchParams.get('keyword') || searchParams.get('search') || '';


    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * pageSize;

    const params: any[] = [];
    let whereClause = 'WHERE checked is null';

    if (role === 1) {
      whereClause += ' AND (u.distributorId = ? OR u.agencyId = ? OR u.seq = ?)';
      params.push(seq, seq, seq);
    }


    if (keyword) {
      whereClause += ` AND (
        s.productLink LIKE ? OR
        s.keyword LIKE ? OR
        u.id LIKE ?
      )`;
      params.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
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

    let fromClause = `
      FROM Extend e
      LEFT JOIN \`slot\` s ON e.slotSeq = s.seq
      LEFT JOIN \`User\` u ON e.userSeq = u.seq
      LEFT JOIN \`User\` a ON s.agencyId = a.seq
      LEFT JOIN \`User\` d ON s.distributorId = d.seq
    `;

   

    const [rows] = await pool.query(
      `SELECT 
        e.seq, 
        e.slotSeq,
        CONCAT(u.id, '(', u.name, ')') AS userId,
        CONCAT(a.id, '(', a.name, ')') AS agencyId,
        CONCAT(d.id, '(', d.name, ')') AS distributorId,
        s.productLink, 
        s.answerTagList,
        s.productPrice,
        s.productId,
        s.storeName,
        s.keyword, 
        s.startDate, 
        s.endDate, 
        s.rank,
        s.thumbnail,
        s.memo,
        s.sortation,
        s.secretKey1,
        s.secretKey2,
        s.secretKey3,
        s.secretKey4,
        s.secretLandingKey1,
        s.secretLandingKey2,
        s.secretLandingKey3,
        s.secretLandingKey4,
        s.status,
        e.extendDay,
        e.checked
      ${fromClause}
      ${whereClause}
      ORDER BY e.seq DESC
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
    const convertedRows = (rows as any[]).map(row => ({
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



// PUT - 연장 일괄 승인
// export async function PUT(request: Request) {
//   try {
//     const body = await request.json();
//     const {seqs} = body; // log의 seq
//     const logType = 2; // 연장 == 2번 

//     const currentUser = await getCurrentUser();
//     if (!currentUser) {
//       return NextResponse.json({ error: '인증 실패' }, { status: 401 });
//     }

//     const { seq, role } = currentUser;

//     if (role != 0 && role != 1) { // 관리자 아닐경우
//       return NextResponse.json({ error: '권한 없음' }, { status: 403 });
//     }

//     if (!Array.isArray(seqs) || seqs.length === 0) {
//       return NextResponse.json({ error: '연장 승인할 슬롯 ID 목록이 없습니다.' }, { status: 400 });
//     }


//        const [extendRows] = await pool.query<any[]>(
//         `SELECT slotSeq FROM extend WHERE seq IN (?) AND checked is null`,
//         [seqs]  // seq는 log.seq 리스트
//       );

//       const slotSeqList = extendRows.map(row => row.slotSeq);
//       if (slotSeqList.length === 0) {
//           throw Error("연장할 슬롯을 찾지 못했습니다.");
//       }

    

//     // 동적으로 SET 절 구성
//     const fields: string[] = [];
//     const values: any[] = [];

        
        

//     const placeholders = seqs.map(() => '?').join(',');

//     values.push(...seqs); // ID 목록도 마지막에 추가

//     const query = `
//       UPDATE Extend
//       SET checked = true
//       WHERE seq IN (${placeholders})
//     `;

//       await pool.query(query, values);
      

//       const [extendSlotRows] = await pool.query<any[]>(`
//         SELECT slotSeq, extendDay
//         FROM Extend
//         WHERE seq IN (${placeholders})
//       `, seqs);

//       // 3. 각 슬롯에 대해 endDate 연장
//       const updateQuery = `
//         UPDATE Slot
//         SET endDate = DATE_ADD(endDate, INTERVAL ? DAY)
//         WHERE seq = ?
//       `;

//       for (const row of extendSlotRows) {
//         await pool.query(updateQuery, [row.extendDay, row.slotSeq]);
//       }

//       const [targetSlotRows] = await pool.query<any[]>(`
//         SELECT * FROM Slot WHERE seq IN (${slotSeqList.map(() => '?').join(',')}) ORDER BY seq ASC
//       `, slotSeqList);
      
 


//      const logValues: any[] = [];

//     for (const slot of targetSlotRows) {
      
//       // const adjustmentDay = Math.ceil(
//       //   (new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24)
//       // ) + 1;
//       let targetRow;

//       for (const row of extendSlotRows) {
//          if(row.slotSeq == slot.seq){
//           targetRow = row;
//           break;
//          }
//       }
//       const adjustmentDay = targetRow?.extendDay;

//       // 2. 사용자 정보 조회
//       const [[user]] = await pool.query<any[]>(`
//         SELECT role, price, distributorId,agencyId
//         FROM User
//         WHERE seq = ?
//       `, [slot.userId]);

//       let price = 0;
//       let agencyPrice = 0;
//       let userPrice = 0;

//       let adjustmentPrice =0;
//       let adjustmentPriceAgency = 0;
//       let adjustmentPriceUser = 0;

//       // 3. price 계산 로직
//       if (user) {
//         if (user.role ===0 || user.role === 1) {
//           price = user.price ?? 0;

//         } else if (user.role == 2) {
//           const [[distributor]] = await pool.query<any[]>(`
//             SELECT price
//             FROM User
//             WHERE seq = ?
//           `, [user.distributorId]);

//           const [[agency]] = await pool.query<any[]>(`
//             SELECT price
//             FROM User
//             WHERE seq = ?
//           `, [user.agencyId]);

//           price = distributor?.price ?? 0;
//           agencyPrice = user.price ?? 0;
          
//         } else if (user.role ==3){

//           const [[distributor]] = await pool.query<any[]>(`
//             SELECT price
//             FROM User
//             WHERE seq = ?
//           `, [user.distributorId]);

//           const [[agency]] = await pool.query<any[]>(`
//             SELECT price
//             FROM User
//             WHERE seq = ?
//           `, [user.agencyId]);
        
//           price = distributor?.price ?? 0;
//           agencyPrice = agency?.price ?? 0;
//           userPrice = user.price ?? 0;
//         }
//       }

//       adjustmentPrice = price * adjustmentDay;
//       adjustmentPriceAgency = agencyPrice * adjustmentDay;
//       adjustmentPriceUser = userPrice * adjustmentDay;

//       const extendedStartDate = new Date(new Date(slot.endDate).getTime()+(9*60 * 60 * 1000) - (adjustmentDay -1 )* 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 'YYYY-MM-DD' 형식


//       // 4. logValues에 푸시
//       logValues.push([
//         logType,
//         slot.createdAt,
//         slot.agencyId || null,
//         slot.distributorId || null,
//         slot.userId,
//         slot.seq,
//         extendedStartDate,  //연장 시작일
//         slot.endDate,
//         adjustmentDay, // 연장일만 
//         slot.keywordLimit,
//         adjustmentPrice,
//         adjustmentPriceAgency,
//         adjustmentPriceUser,
//       ]);
//     }







//       const logQuery = `
//         INSERT INTO Log (type,created_at,agency,distributor,user,slot_seq,start_at,end_at,adjustment_day,keywordLimit,adjustmentPrice,adjustmentPriceAgency,adjustmentPriceUser)
//         VALUES ?
//       `;
//        await pool.query(logQuery, [logValues]);

       
//     return NextResponse.json({ message: '일괄 연장 완료' });
//   } catch (error: any) {
//     console.error('연장 승인 중 오류:', error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }


export async function PUT(request: Request) {
  const connection = await pool.getConnection(); 
  try {
    await connection.beginTransaction(); 

    const body = await request.json();
    const { seqs } = body; // extend 테이블의 seq 리스트
    const logType = 2; // 연장 == 2번

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      await connection.rollback();
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { seq, role } = currentUser;

    if (role != 0 && role != 1) {
      await connection.rollback();
      return NextResponse.json({ error: '권한 없음' }, { status: 403 });
    }

    if (!Array.isArray(seqs) || seqs.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: '연장 승인할 슬롯 ID 목록이 없습니다.' }, { status: 400 });
    }

    // Extend 테이블 조회
    const [extendRows] = await connection.query<any[]>(
      `SELECT slotSeq FROM extend WHERE seq IN (?) AND checked IS NULL`,
      [seqs]
    );

    const slotSeqList = extendRows.map((row) => row.slotSeq);
    if (slotSeqList.length === 0) {
      throw new Error('연장할 슬롯을 찾지 못했습니다.');
    }

    // Extend checked = true 업데이트
    const placeholders = seqs.map(() => '?').join(',');
    await connection.query(
      `
        UPDATE Extend
        SET checked = true
        WHERE seq IN (${placeholders})
      `,
      seqs
    );

    // 연장할 슬롯 정보 조회
    const [extendSlotRows] = await connection.query<any[]>(
      `
        SELECT slotSeq, extendDay
        FROM Extend
        WHERE seq IN (${placeholders})
        AND checked IS NOT NULL
      `,
      seqs
    );

    // endDate 연장
    const updateQuery = `
      UPDATE Slot
      SET endDate = DATE_ADD(endDate, INTERVAL ? DAY)
      WHERE seq = ?
    `;

    for (const row of extendSlotRows) {
      await connection.query(updateQuery, [row.extendDay, row.slotSeq]);
    }

    // 연장 완료된 슬롯 정보 조회
    const [targetSlotRows] = await connection.query<any[]>(
      `
        SELECT * FROM Slot 
        WHERE seq IN (${slotSeqList.map(() => '?').join(',')})
        ORDER BY seq ASC
      `,
      slotSeqList
    );

    const logValues: any[] = [];

    for (const slot of targetSlotRows) {
      const targetRow = extendSlotRows.find((r) => r.slotSeq === slot.seq);
      if (!targetRow) continue;

      const adjustmentDay = targetRow.extendDay;

      // 사용자 정보 조회
      const [[user]] = await connection.query<any[]>(
        `SELECT role, price, distributorId, agencyId FROM User WHERE seq = ?`,
        [slot.userId]
      );

      let price = 0;
      let agencyPrice = 0;
      let userPrice = 0;

      if (user) {
        if (user.role === 0 || user.role === 1) {
          price = user.price ?? 0;
        } else if (user.role === 2) {
          const [[distributor]] = await connection.query<any[]>(
            `SELECT price FROM User WHERE seq = ?`,
            [user.distributorId]
          );
          const [[agency]] = await connection.query<any[]>(
            `SELECT price FROM User WHERE seq = ?`,
            [user.agencyId]
          );

          price = distributor?.price ?? 0;
          agencyPrice = user.price ?? 0;
        } else if (user.role === 3) {
          const [[distributor]] = await connection.query<any[]>(
            `SELECT price FROM User WHERE seq = ?`,
            [user.distributorId]
          );
          const [[agency]] = await connection.query<any[]>(
            `SELECT price FROM User WHERE seq = ?`,
            [user.agencyId]
          );

          price = distributor?.price ?? 0;
          agencyPrice = agency?.price ?? 0;
          userPrice = user.price ?? 0;
        }
      }

      const adjustmentPrice = price * adjustmentDay;
      const adjustmentPriceAgency = agencyPrice * adjustmentDay;
      const adjustmentPriceUser = userPrice * adjustmentDay;

      // 연장 시작일 계산 (주의: slot.endDate는 이미 연장된 상태)
      const extendedStartDate = new Date(
        new Date(slot.endDate).getTime() +
          9 * 60 * 60 * 1000 -
          (adjustmentDay - 1) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .slice(0, 10);

      logValues.push([
        logType,
        slot.createdAt,
        slot.agencyId || null,
        slot.distributorId || null,
        slot.userId,
        slot.seq,
        extendedStartDate,
        slot.endDate,
        adjustmentDay,
        slot.keywordLimit,
        adjustmentPrice,
        adjustmentPriceAgency,
        adjustmentPriceUser,
      ]);
    }
    // 로그 저장
    const logQuery = `
      INSERT INTO Log (
        type, created_at, agency, distributor, user, slot_seq,
        start_at, end_at, adjustment_day, keywordLimit,
        adjustmentPrice, adjustmentPriceAgency, adjustmentPriceUser
      ) VALUES ?
    `;
    await connection.query(logQuery, [logValues]);

    await connection.commit(); 
    return NextResponse.json({ message: '일괄 연장 완료' });
  } catch (error: any) {
    console.error('연장 승인 중 오류:', error);
    await connection.rollback(); 
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    connection.release(); 
  }
}