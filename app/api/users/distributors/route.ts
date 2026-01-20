import { NextResponse } from 'next/server';
import pool from 'lib/db';

// ✅ 총판 목록
export async function GET() {
  const [rows] = await pool.query(
    `SELECT seq, id, name FROM \`User\` WHERE role = 1 AND isDeleted = 0`
  );
  return NextResponse.json(rows);
}