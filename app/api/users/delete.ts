import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import pool from 'lib/db';

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    // 사용자 삭제 대신 isDeleted = 1 업데이트
    await pool.query('UPDATE `User` SET isDeleted = 1 WHERE id = ?', [userId]);

    return NextResponse.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
  }
}
