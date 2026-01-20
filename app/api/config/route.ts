import { NextResponse } from 'next/server';
import pool from 'lib/db';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return { seq: decoded.seq, role: decoded.role };
  } catch {
    return null;
  }
}


// GET: 설정값 조회
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: '로그인 정보 없음' }, { status: 403 });
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM config');
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}





const keyMap = {
  open_start_time: 'openStartTime',
  open_end_time: 'openEndTime',
  edit_start_time: 'editStartTime',
  edit_end_time: 'editEndTime',
};

// camelCase to DB key 매핑
const reverseKeyMap: Record<string, string> = {
  openStartTime: 'open_start_time',
  openEndTime: 'open_end_time',
  editStartTime: 'edit_start_time',
  editEndTime: 'edit_end_time',
};

// POST: 설정값 저장 (업데이트만 수행)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 0) {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 });
  }

  try {
    const body = await req.json(); // { openStartTime: "09:00", ... }

    for (const [camelKey, value] of Object.entries(body)) {
      const dbKey = reverseKeyMap[camelKey];
      if (!dbKey) continue;

      await pool.query(
        `UPDATE config SET value = ? WHERE \`key\` = ?`,
        [value, dbKey]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('설정 업데이트 오류:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}