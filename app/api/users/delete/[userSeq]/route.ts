import { NextResponse } from 'next/server';
import pool from 'lib/db';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return { seq: decoded.seq, role: decoded.role, id: decoded.id };
  } catch (err) {
    return null;
  }
}



export async function DELETE(
  request: Request,
  { params }: { params: { userSeq: string } }
){
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
    const { seq, role, id } = currentUser;
    
    const {userSeq} = await params;
  
    if (!userSeq) {
      return NextResponse.json({ message: 'userSeq missing.' }, { status: 400 });
    }

    const [targetrows] = await pool.query('SELECT seq, role FROM `User` WHERE seq = ? AND isDeleted = 0', [userSeq]);
    const target = (targetrows as any)[0];
    if (!target) {
    return NextResponse.json({ message: '대상을 찾을 수 없습니다.' }, { status: 404 });
    }
    if(target.seq == seq){
        return NextResponse.json({ message: '본인을 삭제할 수 없습니다.' }, { status: 400 });
    }

    const [slotRows] = await pool.query<any[]>( `SELECT seq, productLink, keyword, singleLink, sortation,memo,userId,agencyId,distributorId FROM Slot WHERE userId=? OR  agencyId =? OR distributorId =?`,[userSeq,userSeq,userSeq]);
    const [userRows] = await pool.query<any[]>('SELECT seq, role FROM `User` WHERE seq = ? OR agencyId = ? OR distributorId =?', [userSeq,userSeq,userSeq]);

    const [extendRows] = await pool.query<any[]>( `SELECT seq, slotSeq,userSeq,extendDay,checked,agencyId,distributorId FROM extend WHERE userSeq=? OR  agencyId =? OR distributorId =?`,[userSeq,userSeq,userSeq]);
      // 2️⃣ Slot 테이블 업데이트
    const conn = await pool.getConnection();
    try{
        await conn.beginTransaction();
        for (const slot of slotRows) {
            const updates: string[] = [];
            const params: any[] = [];

            if (slot.userId == userSeq) {
                updates.push('userId = NULL');
            }
            if (slot.agencyId == userSeq) {
                updates.push('agencyId = NULL');
            }
            if (slot.distributorId == userSeq) {
                updates.push('distributorId = NULL');
            }

            if (updates.length > 0) {
                const sql = `UPDATE Slot SET ${updates.join(', ')} WHERE seq = ?`;
                params.push(slot.seq);
                await conn.query(sql, params);
            }
        }

        for (const user of userRows) {
            const updates: string[] = [];
            const params: any[] = [];

            if (user.agencyId == userSeq) {
                updates.push('agencyId = NULL');
            }
            if (user.distributorId == userSeq) {
                updates.push('distributorId = NULL');
            }

            if (updates.length > 0) {
                const sql = `UPDATE User SET ${updates.join(', ')} WHERE seq = ?`;
                params.push(user.seq);
                await conn.query(sql, params);
            }
        }


        for (const extend of extendRows) {
            const updates: string[] = [];
            const params: any[] = [];

            if (extend.userSeq == userSeq) {
              await conn.query(`DELETE FROM extend WHERE seq = ?`, [extend.seq]);
              continue;
            }

            if (extend.agencyId == userSeq) {
                updates.push('agencyId = NULL');
            }
            if (extend.distributorId == userSeq) {
                updates.push('distributorId = NULL');
            }

            if (updates.length > 0) {
                const sql = `UPDATE extend SET ${updates.join(', ')} WHERE seq = ?`;
                params.push(extend.seq);
                await conn.query(sql, params);
            }
        }


        await conn.query( `DELETE FROM User WHERE seq = ?`,[userSeq]);

        await conn.commit();
    }catch(e){
        await conn.rollback();
        console.log(e);
        return NextResponse.json({ message: '삭제 중 오류발생' }, { status: 500 });
    } finally {
    conn.release(); // 반드시 커넥션 반환
    }
    return NextResponse.json({ message: '삭제 완료' }, { status: 200 });

}