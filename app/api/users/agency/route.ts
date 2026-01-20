import pool from "lib/db";
import { NextResponse } from "next/server";

// ✅ GET: 유저 목록 조회
export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT 
          u.seq, 
          u.id, 
          u.name, 
          u.role, 
          u.createdAt,
          u.excelAllow,
          u.additionalRegAllow,
          u.slotAllow,
          u.userAllow,
          u.rankingCheckAllow,
          u.price,
          u.agencyId AS agencySeq,
          CONCAT(a.id, '(', a.name, ')') AS agencyId,
          u.distributorId AS distributorSeq,
          CONCAT(d.id, '(', d.name, ')') AS distributorId,

          (
            SELECT COUNT(*) 
            FROM \`User\` AS sub_user 
            WHERE sub_user.agencyId = u.seq AND sub_user.isDeleted = 0 AND sub_user.role =3
          ) AS userCount,

          (
            SELECT COUNT(*) 
            FROM \`Slot\` AS s 
            WHERE s.agencyId = u.seq OR s.userId = u.seq
          ) AS slotCount

      FROM \`User\` AS u
      LEFT JOIN \`User\` AS a ON u.agencyId = a.seq
      LEFT JOIN \`User\` AS d ON u.distributorId = d.seq
      WHERE u.isDeleted = 0 AND u.role = 2`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('유저 조회 실패:', error);
    return NextResponse.json({ error: '유저 조회 실패' }, { status: 500 });
  }
}