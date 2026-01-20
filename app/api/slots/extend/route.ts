import { NextResponse } from 'next/server';
import pool from 'lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
interface SlotRow {
  userSeq: number;
  agencyId: number;
  distributorId: number;
}

export async function POST(request: Request) {
  const connection = await pool.getConnection(); 
  try {
    await connection.beginTransaction(); 

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
    const { seq, role } = currentUser;

    const { seqs, extendDays } = await request.json();


    if (!Array.isArray(seqs) || !seqs.length || typeof extendDays !== 'number') {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    

    if(role == 0){ // 관리자일경우 자동 연장 처리 
      const placeholders = seqs.map(() => '?').join(',');
      const query = `
        UPDATE slot
        SET endDate = DATE_ADD(endDate, INTERVAL ? DAY)
        WHERE seq IN (${placeholders})
      `;

 
   

      await connection.query(query, [extendDays, ...seqs]);

       const [targetSlotRows] = await connection.query<any[]>(
       `
          SELECT * FROM Slot WHERE seq IN (${placeholders})
          ORDER BY seq ASC
        `,
        seqs // ← 여기서 진짜 파라미터로 seq 배열을 넘겨야 함
      );


     
      const logValues: any[] = [];

      for (const slot of targetSlotRows) {
    
        // 2. 사용자 정보 조회
        const [[user]] = await connection.query<any[]>(`
          SELECT role, price, distributorId,agencyId
          FROM User
          WHERE seq = ?
        `, [slot.userId]);

        

        // 3. price 계산 로직
        
        let price = 0;
        let agencyPrice = 0;
        let userPrice = 0;

        let adjustmentPrice =0;
        let adjustmentPriceAgency = 0;
        let adjustmentPriceUser = 0;

        // 3. price 계산 로직
        if (user) {
          if (user.role ===0 || user.role === 1) {
            // 대리점이면 본인 가격 사용
            price = user.price ?? 0;

          } else if (user.role == 2) {
            const [[distributor]] = await connection.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.distributorId]);

            const [[agency]] = await connection.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.agencyId]);

            price = distributor?.price ?? 0;
            agencyPrice = user.price ?? 0;
            
          } else if (user.role ==3){

            const [[distributor]] = await connection.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.distributorId]);

            const [[agency]] = await connection.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.agencyId]);
          
            price = distributor?.price ?? 0;
            agencyPrice = agency?.price ?? 0;
            userPrice = user.price ?? 0;
          }
        }

        adjustmentPrice = price * extendDays;
        adjustmentPriceAgency = agencyPrice * extendDays;
        adjustmentPriceUser = userPrice * extendDays;

      const extendedStartDate = new Date(new Date(slot.endDate).getTime()+(9*60 * 60 * 1000)- (extendDays-1) * 24 * 60 * 60 * 1000)
        .toISOString().slice(0, 10); // 'YYYY-MM-DD' 형식


        // logValues에 푸시
        logValues.push([
          2,
          slot.createdAt,
          slot.agencyId || null,
          slot.distributorId || null,
          slot.userId,
          slot.seq,
          extendedStartDate, // 연장 시작일
          slot.endDate,
          extendDays,
          slot.keywordLimit,
          adjustmentPrice,
          adjustmentPriceAgency,
          adjustmentPriceUser
        ]);
      }


      const logQuery = `
        INSERT INTO Log (type,created_at,agency,distributor,user,slot_seq,start_at,end_at,adjustment_day,keywordLimit,adjustmentPrice,adjustmentPriceAgency,adjustmentPriceUser)
        VALUES ?
      `;
       await connection.query(logQuery, [logValues]);

      return NextResponse.json({ message: `슬롯 ${extendDays}일 연장 완료` });



    }else{  //연장 요청일경우

      for(const slotSeq of seqs){
       const checkQuery = `
          SELECT seq from extend where slotSeq = ? AND  checked IS NULL
        `;
        const [rows]:[any[],any] = await connection.query(checkQuery, [
          slotSeq,
        ]);

        if (rows.length > 0) {
          await connection.rollback();
          return NextResponse.json({ message: `중복 연장 감지` }, { status: 429 });
        }
      }

      for (const slotSeq of seqs) {
        const userQuery = `
          SELECT userId, agencyId, distributorId
          FROM slot
          WHERE seq = ?
        `;


        const [rows] = await connection.query(userQuery, [slotSeq]) as unknown as [any[], any];

        const slot = rows[0];

        if (!slot) continue; // slot이 없으면 skip



        const insertQuery = `
          INSERT INTO extend (slotSeq, userSeq, extendDay, checked, agencyId, distributorId)
          VALUES (?, ?, ?, null, ?, ?)
        `;

        await connection.query(insertQuery, [
          slotSeq,
          seq,
          extendDays,
          slot.agencyId,
          slot.distributorId,
        ]);
      }
      await connection.commit();
      return NextResponse.json({ message: `슬롯 ${extendDays}일 연장  요청 완료` });
    }
  } catch (error) {
    await connection.rollback();
    console.error('슬롯 연장 오류:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }finally {
    connection.release(); 
  }
}
