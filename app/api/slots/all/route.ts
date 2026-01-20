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
        s.productLink LIKE ? OR
        s.keyword LIKE ? OR
        u.id LIKE ?
      )`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    if (userId) {
      whereClause += ' AND u.seq = ?';
      params.push(userId);
    }

    if (startDate) {
      whereClause += ' AND s.startDate >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND s.endDate <= ?';
      params.push(endDate);
    }

    whereClause += ' AND s.endDate >= DATE_ADD(CURDATE(), INTERVAL 1 DAY)';

    // 슬롯 검색타입
    if (slotSearchType !== 0) {
      if (slotSearchType === 1) {
        whereClause += ` AND DATE_SUB(s.startDate, INTERVAL 1 DAY) <= CURDATE() AND s.endDate >= CURDATE() AND s.status = true
        AND s.sortation != 0
          AND s.thumbnail IS NOT NULL AND s.thumbnail <> ''
          AND s.productPrice IS NOT NULL AND s.productPrice <> 0
          AND s.answerTagList IS NOT NULL
          AND s.storeName IS NOT NULL
          AND s.productId IS NOT NULL
          AND (
            COALESCE(TRIM(s.productLink), '') = ''
            OR (
              COALESCE(s.comparePriceLowestPrice, 0) > 0
              AND COALESCE(s.comparePriceURL, '') <> ''
              AND COALESCE(s.comparePriceSalePlaceCount, 0) > 0
            )
          )
          AND (
            (s.keywordLimit = 4 AND (
              (s.sortation = 2 AND (
                s.secretLandingKey1 IS NOT NULL
                OR s.secretLandingKey2 IS NOT NULL
                OR s.secretLandingKey3 IS NOT NULL
                OR s.secretLandingKey4 IS NOT NULL
              ))
              OR
              (s.sortation = 1 AND (
                s.secretKey1 IS NOT NULL
                OR s.secretKey2 IS NOT NULL
                OR s.secretKey3 IS NOT NULL
                OR s.secretKey4 IS NOT NULL
              ))
            ))
            OR (s.keywordLimit = 3 AND (
              (s.sortation = 2 AND (
                s.secretLandingKey1 IS NOT NULL
                OR s.secretLandingKey2 IS NOT NULL
                OR s.secretLandingKey3 IS NOT NULL
              ))
              OR
              (s.sortation = 1 AND (
                s.secretKey1 IS NOT NULL
                OR s.secretKey2 IS NOT NULL
                OR s.secretKey3 IS NOT NULL
              ))
            ))
            OR (s.keywordLimit = 2 AND (
              (s.sortation = 2 AND (
                s.secretLandingKey1 IS NOT NULL
                OR s.secretLandingKey2 IS NOT NULL
              ))
              OR
              (s.sortation = 1 AND (
                s.secretKey1 IS NOT NULL
                OR s.secretKey2 IS NOT NULL
              ))
            ))
            OR (s.keywordLimit = 1 AND (
              (s.sortation = 2 AND s.secretLandingKey1 IS NOT NULL)
              OR
              (s.sortation = 1 AND s.secretKey1 IS NOT NULL)
            ))
          )
        
        `;
      } else if (slotSearchType === 2) {
        whereClause += `
          AND NOT (
            s.status = true
            AND s.sortation <> 0
            AND s.thumbnail IS NOT NULL AND s.thumbnail <> ''
            AND s.productPrice IS NOT NULL AND s.productPrice > 0
            AND s.answerTagList IS NOT NULL
            AND s.storeName IS NOT NULL AND s.storeName <> ''
            AND s.productId IS NOT NULL
            AND (
              COALESCE(TRIM(s.productLink), '') = ''
              OR (
                COALESCE(s.comparePriceLowestPrice, 0) > 0
                AND COALESCE(s.comparePriceURL, '') <> ''
                AND COALESCE(s.comparePriceSalePlaceCount, 0) > 0
              )
            )
            AND (
              (s.keywordLimit = 4 AND (
                (s.sortation = 2 AND (
                  s.secretLandingKey1 IS NOT NULL
                  OR s.secretLandingKey2 IS NOT NULL
                  OR s.secretLandingKey3 IS NOT NULL
                  OR s.secretLandingKey4 IS NOT NULL
                ))
                OR
                (s.sortation = 1 AND (
                  s.secretKey1 IS NOT NULL
                  OR s.secretKey2 IS NOT NULL
                  OR s.secretKey3 IS NOT NULL
                  OR s.secretKey4 IS NOT NULL
                ))
              ))
              OR (s.keywordLimit = 3 AND (
                (s.sortation = 2 AND (
                  s.secretLandingKey1 IS NOT NULL
                  OR s.secretLandingKey2 IS NOT NULL
                  OR s.secretLandingKey3 IS NOT NULL
                ))
                OR
                (s.sortation = 1 AND (
                  s.secretKey1 IS NOT NULL
                  OR s.secretKey2 IS NOT NULL
                  OR s.secretKey3 IS NOT NULL
                ))
              ))
              OR (s.keywordLimit = 2 AND (
                (s.sortation = 2 AND (
                  s.secretLandingKey1 IS NOT NULL
                  OR s.secretLandingKey2 IS NOT NULL
                ))
                OR
                (s.sortation = 1 AND (
                  s.secretKey1 IS NOT NULL
                  OR s.secretKey2 IS NOT NULL
                ))
              ))
              OR (s.keywordLimit = 1 AND (
                (s.sortation = 2 AND s.secretLandingKey1 IS NOT NULL)
                OR
                (s.sortation = 1 AND s.secretKey1 IS NOT NULL)
              ))
            )
          )
        `;
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
    `;

    if (rankOption === 1 || rankOption === -1) {
      const comparison = rankOption === 1 ? '<' : '>';
      fromClause += `
        JOIN (
          WITH RankedSlot AS (
            SELECT
              sr.productLink,
              sr.keyword,
              sr.ranking,
              DATE(sr.created) AS rankDate,
              sr.created,
              ROW_NUMBER() OVER (
                PARTITION BY sr.productLink, sr.keyword, DATE(sr.created)
                ORDER BY sr.created DESC
              ) AS rn
            FROM slot_ranking sr
          )
          SELECT
            today.productLink,
            today.keyword
          FROM RankedSlot today
          JOIN RankedSlot yesterday
            ON today.productLink <=> yesterday.productLink
            AND today.keyword <=> yesterday.keyword
          WHERE
            today.rn = 1
            AND yesterday.rn = 1
            AND DATE(today.rankDate) = CURDATE()
            AND DATE(yesterday.rankDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND today.ranking ${comparison} yesterday.ranking
        ) rankFilter
        ON (
          (s.productLink = rankFilter.productLink OR (s.productLink IS NULL AND rankFilter.productLink IS NULL))
          AND
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
        s.productLink, 
        s.answerTagList,
        s.productPrice,
        s.productId,
        s.storeName,
        s.keyword, 
        s.startDate, 
        s.endDate, 
        s.rank,
        s.thumbnail,
        s.memo,
        s.sortation,
        s.secretKey1,
        s.secretKey2,
        s.secretKey3,
        s.secretKey4,
        s.secretLandingKey1,
        s.secretLandingKey2,
        s.secretLandingKey3,
        s.secretLandingKey4,
        s.status,
        s.singleLink,
        s.errMsg,
        s.sceretKeyLinkType1,
        s.sceretKeyLinkType2,
        s.sceretKeyLinkType3,
        s.sceretKeyLinkType4,
        s.keywordLimit,
        s.comparePriceLowestPrice,
        s.comparePriceURL,
        s.comparePriceSalePlaceCount,
        s.productPrice,
        s.answerTagList,
        s.storeName,
        s.extraTime

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
