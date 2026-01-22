// /app/api/slots/all/route.ts
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
    return { seq: decoded.seq, role: decoded.role, id: decoded.id };
  } catch (err) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { seq, role } = currentUser;
    const { searchParams } = new URL(request.url);

    const keyword = searchParams.get('keyword') || searchParams.get('search') || '';
    const rankOption = Number(searchParams.get('rankOption') || '0');
    const slotSearchType = Number(searchParams.get('slotSearchType') || '1');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const params: any[] = [];
    let whereClause = 'WHERE 1=1';

    // 권한 필터
    if (role === 1) {
      whereClause += ' AND (u.distributorId = ? OR u.agencyId = ? OR u.seq = ?)';
      params.push(seq, seq, seq);
    } else if (role === 2) {
      whereClause += ' AND (u.agencyId = ? OR u.seq = ?)';
      params.push(seq, seq);
    } else if (role === 3) {
      whereClause += ' AND u.seq = ?';
      params.push(seq);
    }

    // 검색 조건
    if (keyword) {
      whereClause += ` AND (
        s.keyword LIKE ? OR
        u.id LIKE ?
      )`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (userId) {
      whereClause += ' AND u.seq = ?';
      params.push(userId);
    }



    if (endDate) {
      whereClause += ' AND s.startDate <= ? AND s.endDate >= ?';
      params.push(endDate, endDate);
    }
    // 슬롯 검색타입
    if (slotSearchType !== 0) {
      if (slotSearchType === 1) {
        whereClause += ` AND DATE_SUB(s.startDate, INTERVAL 1 DAY) <= CURDATE() AND s.endDate >= CURDATE() 
          AND s.keyword IS NOT NULL AND s.keyword <> ''
          AND s.singleLink IS NOT NULL AND s.singleLink <> ''
          AND s.mid IS NOT NULL AND s.mid <> ''
          AND sr.seq IS NOT NULL`;
      } else if (slotSearchType === 2) {
        whereClause += ` AND (s.keyword IS NULL OR s.keyword = '' 
          OR s.singleLink IS NULL OR s.singleLink = '' 
          OR s.mid IS NULL OR s.mid = ''
          OR sr.seq IS NULL)`;
      } else if (slotSearchType === 3) {
        whereClause += ' AND s.rank IS NULL';
      } else if (slotSearchType === 4) {
        whereClause += ' AND s.endDate = CURDATE()';
      }
    }

    let fromClause = `
      FROM Slot s
      LEFT JOIN \`User\` u ON s.userId = u.seq
      LEFT JOIN \`User\` a ON s.agencyId = a.seq
      LEFT JOIN \`User\` d ON s.distributorId = d.seq
      LEFT JOIN (
        SELECT keyword, singleLink, MAX(seq) as seq
        FROM slot_ranking
        WHERE DATE(created) = CURDATE()
        GROUP BY keyword, singleLink
      ) sr ON s.keyword = sr.keyword AND s.singleLink = sr.singleLink
    `;

    if (rankOption === 1 || rankOption === -1) {
      const comparison = rankOption === 1 ? '<' : '>';
      fromClause += `
        JOIN (
          WITH RankedSlot AS (
            SELECT
              sr.keyword,
              sr.ranking,
              DATE(sr.created) AS rankDate,
              sr.created,
              ROW_NUMBER() OVER (
                PARTITION BY sr.keyword, DATE(sr.created)
                ORDER BY sr.created DESC
              ) AS rn
            FROM slot_ranking sr
          )
          SELECT
            today.keyword
          FROM RankedSlot today
          JOIN RankedSlot yesterday
            ON today.keyword <=> yesterday.keyword
          WHERE
            today.rn = 1
            AND yesterday.rn = 1
            AND DATE(today.rankDate) = CURDATE()
            AND DATE(yesterday.rankDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND today.ranking ${comparison} yesterday.ranking
        ) rankFilter
        ON (
          (s.keyword = rankFilter.keyword OR (s.keyword IS NULL AND rankFilter.keyword IS NULL))
        )
      `;
    }

    const [slots] = await pool.query<any[]>(
      `SELECT 
        s.seq, 
        s.createdAt,
        CONCAT(u.id, '\n(', u.name, ')') AS userId,
        CONCAT(a.id, '\n(', a.name, ')') AS agencyId,
        CONCAT(d.id, '\n(', d.name, ')') AS distributorId,
        s.keyword, 
        s.startDate, 
        s.endDate, 
        s.rank,
        s.memo,
        s.singleLink,
        s.errMsg

      ${fromClause}
      ${whereClause}
      ORDER BY s.seq DESC`,
      params
    );

    const convertToKSTDate = (utcDate: string) => {
      const date = new Date(utcDate);
      const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      return kst.toISOString().split('T')[0];
    };

    const convertedRows = (slots as any[]).map(row => ({
      ...row,
      startDate: row.startDate ? convertToKSTDate(row.startDate) : null,
      endDate: row.endDate ? convertToKSTDate(row.endDate) : null,
    }));

    return NextResponse.json({ data: convertedRows });
  } catch (error: any) {
    console.error('슬롯 전체 목록 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
}
