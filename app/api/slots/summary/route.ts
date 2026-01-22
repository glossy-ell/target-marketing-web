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

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { seq, role } = currentUser;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (role === 1) {
      where += ' AND (u.distributorId = ? OR u.agencyId = ? OR u.seq = ?)';
      params.push(seq, seq, seq);
    } else if (role === 2) {
      where += ' AND (u.agencyId = ? OR u.seq = ?)';
      params.push(seq, seq);
    } else if (role === 3) {
      where += ' AND u.seq = ?';
      params.push(seq);
    }

    const [rows]: any = await pool.query(   
      `
      SELECT 
        COUNT(CASE WHEN s.endDate >= CURDATE() THEN 1 END) AS total,
        COUNT(CASE WHEN s.endDate < CURDATE() THEN 1 END) AS expired,
        COUNT(
            CASE
              WHEN s.rank IS NULL
                  AND NOT (
                    (s.singleLink IS NOT NULL )
                  )
              THEN 1
            END
          )AS waiting,
          COUNT(CASE 
            WHEN DATE_SUB(s.startDate, INTERVAL 1 DAY) <= CURDATE() 
             AND s.endDate >= CURDATE()
             AND s.keyword IS NOT NULL AND s.keyword <> ''
             AND s.singleLink IS NOT NULL AND s.singleLink <> ''
             AND s.mid IS NOT NULL AND s.mid <> ''
             AND sr.seq IS NOT NULL
         THEN 1 
          END) AS active,
      
          COUNT(
            CASE 
              WHEN s.endDate >= CURDATE() AND 
                (
                  s.keyword IS NULL OR s.keyword = ''
                  OR s.singleLink IS NULL OR s.singleLink = ''
                  OR s.mid IS NULL OR s.mid = ''
                  OR sr.seq IS NULL
                )
              THEN 1 
            END
        ) AS error,
        COUNT(CASE WHEN s.endDate = CURDATE() THEN 1 END) AS closingToday
      FROM Slot s
      LEFT JOIN \`User\` u ON s.userId = u.seq
      LEFT JOIN (
        SELECT keyword, singleLink, MAX(seq) as seq
        FROM slot_ranking
        WHERE DATE(created) = CURDATE()
        GROUP BY keyword, singleLink
      ) sr ON s.keyword = sr.keyword AND s.singleLink = sr.singleLink
      ${where}
    `,
      params
    );
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('슬롯 통계 오류:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
