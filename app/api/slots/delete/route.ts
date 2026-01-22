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


// DELETE - 슬롯 삭제 (단일 및 일괄 삭제)
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
    const userSeq = currentUser.seq;
    const role = currentUser.role;

  if (role !=0) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }


    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Request body가 필요합니다.' }, { status: 400 });
    }
    const { seq, seqs } = body;

    if (seq) {

      
      const [targetSlotRows] = await pool.query<any[]>(
        `SELECT * FROM Slot WHERE seq IN (?) ORDER BY seq ASC`,
        [seq]
      );

      const targetSlot = targetSlotRows[0];


      const [[user]] = await pool.query<any[]>(`
        SELECT role, price, distributorId,agencyId
        FROM User
        WHERE seq = ?
      `, [targetSlot.userId]);


      let price = 0;
      let agencyPrice = 0;
      let userPrice = 0;

      let refundPrice =0;
      let refundPriceAgency = 0;
      let refundPriceUser = 0;



      if (user) {
          if (user.role ===0 || user.role === 1) {
            // 대리점이면 본인 가격 사용
            price = user.price ?? 0;

          } else if (user.role == 2) {
            const [[distributor]] = await pool.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.distributorId]);

            const [[agency]] = await pool.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.agencyId]);

            price = distributor?.price ?? 0;
            agencyPrice = user.price ?? 0;
            
          } else if (user.role ==3){

            const [[distributor]] = await pool.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.distributorId]);

            const [[agency]] = await pool.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.agencyId]);
          
            price = distributor?.price ?? 0;
            agencyPrice = agency?.price ?? 0;
            userPrice = user.price ?? 0;
          }
        }

      const logType = isSameDate(new Date(),targetSlot.createdAt) ? 4:3;

      const now = new Date();
      const startDate = new Date(targetSlot.startDate);
      const baseDate = now > startDate ? now : startDate;

      let plusDay = now > startDate ?  0 : 1;

      const adjustmentDay = Math.ceil(
        (new Date(targetSlot.endDate).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + plusDay;


      refundPrice = price * adjustmentDay;
      refundPriceAgency = agencyPrice * adjustmentDay;
      refundPriceUser = userPrice * adjustmentDay;


      await pool.query('DELETE FROM Slot WHERE seq = ?', [seq]);
      
  
   

      const logQuery = `
      INSERT INTO Log (type,created_at,refund_at,agency,distributor,user,slot_seq,start_at,end_at,adjustment_day,refundPrice,refundPriceAgency,refundPriceUser)
      VALUES ?
      `; // 로그 추가 
      const logValues =  [[
        logType,
        targetSlot.createdAt,
        new Date(),
        targetSlot.agencyId || null,      // agency
        targetSlot.distributorId || null, // distributor
        targetSlot.userId,
        seq,  // ← slot의 seq 넣기
        targetSlot.startDate,
        targetSlot.endDate,
        adjustmentDay,
        refundPrice,
        refundPriceAgency,
        refundPriceUser
      ]];


      const [logResult] = await pool.query(logQuery, [logValues]);

      //랭킹 삭제
      let query = `
      DELETE FROM slot_ranking
      WHERE keyword = ?
    `;
      const sqlParams = [targetSlot.keyword];
   

      // singleLink 처리
      if (targetSlot.singleLink === null || targetSlot.singleLink === undefined) {
        query += ' AND singleLink IS NULL';
      } else {
        query += ' AND singleLink = ?';
        sqlParams.push(targetSlot.singleLink);
      }

      const [rows] = await pool.query(
        query,
        sqlParams
      );



    } else if (Array.isArray(seqs) && seqs.length > 0) {

       const [targetSlotRows] = await pool.query<any[]>(`
        SELECT * FROM Slot WHERE seq IN (${seqs.map(() => '?').join(',')}) ORDER BY seq ASC
      `, seqs);


      const placeholders = seqs.map(() => '?').join(',');

      let price = 0;
      const logValues: any[] = [];
      for (let i = 0; i < targetSlotRows.length; i++) {
        const slot = targetSlotRows[i];
        const insertedId = seqs[i];

      

        // 1. 사용자 정보 조회
        const [[user]] = await pool.query<any[]>(`
          SELECT role, price, distributorId,agencyId
          FROM User
          WHERE seq = ?
        `, [slot.userId]);

      let price = 0;
      let agencyPrice = 0;
      let userPrice = 0;

      let refundPrice =0;
      let refundPriceAgency = 0;
      let refundPriceUser = 0;

      // 3. price 계산 로직
      if (user) {
        if (user.role ===0 || user.role === 1) {
          // 대리점이면 본인 가격 사용
          price = user.price ?? 0;

        } else if (user.role == 2) {
          const [[distributor]] = await pool.query<any[]>(`
            SELECT price
            FROM User
            WHERE seq = ?
          `, [user.distributorId]);

          const [[agency]] = await pool.query<any[]>(`
            SELECT price
            FROM User
            WHERE seq = ?
          `, [user.agencyId]);

          price = distributor?.price ?? 0;
          agencyPrice = user.price ?? 0;
          
        } else if (user.role ==3){

          const [[distributor]] = await pool.query<any[]>(`
            SELECT price
            FROM User
            WHERE seq = ?
          `, [user.distributorId]);

          const [[agency]] = await pool.query<any[]>(`
            SELECT price
            FROM User
            WHERE seq = ?
          `, [user.agencyId]);
        
          price = distributor?.price ?? 0;
          agencyPrice = agency?.price ?? 0;
          userPrice = user.price ?? 0;
        }
      }

   
      
      const logType = isSameDate(new Date(),slot.createdAt) ? 4:3;

      const now = new Date();
      const startDate = new Date(slot.startDate);
      const baseDate = now > startDate ? now : startDate;

      let plusDay = now > startDate ?  0 : 1;

      const adjustmentDay = Math.ceil(
        (new Date(slot.endDate).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + plusDay;


      refundPrice = price * adjustmentDay;
      refundPriceAgency = agencyPrice * adjustmentDay;
      refundPriceUser = userPrice * adjustmentDay;

              



        logValues.push([
          logType,
          slot.createdAt,
          slot.agencyId || null,
          slot.distributorId || null,
          slot.userId,
          insertedId,
          slot.startDate,
          slot.endDate,
          adjustmentDay,
          refundPrice,
          refundPriceAgency,
          refundPriceUser
        ]);
      }


      await pool.query(`DELETE FROM Slot WHERE seq IN (${placeholders})`, seqs);

   

      const logQuery = `
        INSERT INTO Log (type,created_at,agency,distributor,user,slot_seq,start_at,end_at,adjustment_day,refundPrice,refundPriceAgency,refundPriceUser)
        VALUES ?
      `;
       await pool.query(logQuery, [logValues]);

      //랭킹 삭제 작업 
      for (const targetSlot of targetSlotRows) {
        let query = `
          DELETE FROM slot_ranking
          WHERE keyword = ?
        `;
        const sqlParams = [targetSlot.keyword];


 
        // singleLink 조건 처리
        if (targetSlot.singleLink === null || targetSlot.singleLink === undefined) {
          query += ' AND singleLink IS NULL';
        } else {
          query += ' AND singleLink = ?';
          sqlParams.push(targetSlot.singleLink);
        }

        // 삭제 실행
        await pool.query(query, sqlParams);
      }
    } else {
      return NextResponse.json({ error: '삭제할 seq 또는 seqs가 필요합니다.' }, { status: 400 });
    }

    return NextResponse.json({ message: '삭제 완료' }); 
  } catch (error: any) {
    console.error('슬롯 삭제 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
