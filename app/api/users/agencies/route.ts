import { NextResponse } from 'next/server';
import pool from 'lib/db';
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


// ✅ 대행사 목록
export async function GET(request: Request) {

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 });
  }
  const { seq, role, id } = currentUser;

  const url = new URL(request.url);
  const distributorSeq = url.searchParams.get('seq');

  if(!distributorSeq){
    if(role ==0){
      const [rows] = await pool.query(
        `SELECT seq, id, name FROM \`User\` WHERE role = 2 AND isDeleted = 0`
      );
      return NextResponse.json(rows);
    }
    else if(role ==1 ){
    const [rows] = await pool.query(
        `SELECT seq, id, name FROM \`User\` WHERE role = 2 AND isDeleted = 0 AND  distributorId =?`
      ,[seq]);
      return NextResponse.json(rows);
    }
  }else{
    if(role ==0){
      const [rows] = await pool.query(
        `SELECT seq, id, name FROM \`User\` WHERE role = 2 AND isDeleted = 0 AND distributorId =? `,[distributorSeq]
      );
      return NextResponse.json(rows);
    }
    else if(role ==1 ){
    const [rows] = await pool.query(
        `SELECT seq, id, name FROM \`User\` WHERE role = 2 AND isDeleted = 0 AND  distributorId =? AND distributorId =? `
      ,[seq,distributorSeq]);
      return NextResponse.json(rows);
    }
  }
  return NextResponse.json([]);
}
