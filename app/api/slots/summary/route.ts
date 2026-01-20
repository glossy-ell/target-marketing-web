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
              WHEN s.status = false
                  AND s.rank IS NULL
                  AND NOT (
                    (singleLink IS NOT NULL AND singleLink LIKE '%.brand%')
                    AND productLink IS NULL
                  )
              THEN 1
            END
          )AS waiting,
          COUNT(CASE 
            WHEN DATE_SUB(s.startDate, INTERVAL 1 DAY) <= CURDATE() 
             AND s.endDate >= CURDATE()  AND s.status = true AND NOT 
            (
              s.sortation = 0
              OR (
                  s.keywordLimit = 4
                  AND (
                      (s.sortation = 2 AND (
                          s.secretLandingKey1 IS NULL
                          OR s.secretLandingKey2 IS NULL
                          OR s.secretLandingKey3 IS NULL
                          OR s.secretLandingKey4 IS NULL
                      ))
                      OR
                      (s.sortation = 1 AND (
                          s.secretKey1 IS NULL
                          OR s.secretKey2 IS NULL
                          OR s.secretKey3 IS NULL
                          OR s.secretKey4 IS NULL
                      ))
                  )
              )
              OR (
                  s.keywordLimit = 3
                  AND (
                      (s.sortation = 2 AND (
                          s.secretLandingKey1 IS NULL
                          OR s.secretLandingKey2 IS NULL
                          OR s.secretLandingKey3 IS NULL
                      ))
                      OR
                      (s.sortation = 1 AND (
                          s.secretKey1 IS NULL
                          OR s.secretKey2 IS NULL
                          OR s.secretKey3 IS NULL
                      ))
                  )
              )
              OR (
                  s.keywordLimit = 2
                  AND (
                      (s.sortation = 2 AND (
                          s.secretLandingKey1 IS NULL
                          OR s.secretLandingKey2 IS NULL
                      ))
                      OR
                      (s.sortation = 1 AND (
                          s.secretKey1 IS NULL
                          OR s.secretKey2 IS NULL
                      ))
                  )
              )
              OR (
                  s.keywordLimit = 1
                  AND (
                      (s.sortation = 2 AND (
                          s.secretLandingKey1 IS NULL
                      ))
                      OR
                      (s.sortation = 1 AND (
                          s.secretKey1 IS NULL
                      ))
                  )
              )
          )
         THEN 1 
          END) AS active,
      
          COUNT(
            CASE 
                WHEN s.endDate >= CURDATE() AND ( s.status = false OR s.sortation = 0 OR COALESCE(s.productPrice, 0) <= 0 
                
                        OR s.thumbnail IS NULL
                        OR s.thumbnail = ''
                        OR s.productPrice IS NULL 
                        OR s.productPrice = 0
                        OR s.answerTagList IS NULL 
                        OR s.storeName IS NULL 
                        OR s.productId IS NULL
                        OR (
                          COALESCE(TRIM(s.productLink), '') <> '' 
                          AND (
                            COALESCE(s.comparePriceLowestPrice, 0) <= 0
                            OR COALESCE(s.comparePriceURL, '') = ''
                            OR COALESCE(s.comparePriceSalePlaceCount, 0) <= 0
                          )
                        )

                    OR
                    (
                      (
                        COALESCE(s.comparePriceLowestPrice, 0) <= 0 OR
                        COALESCE(s.comparePriceSalePlaceCount, 0) <= 0 
                      ) AND COALESCE(TRIM(productLink), '') <> ''

                    )OR
                    (
                      s.keywordLimit = 4 AND
                          (
                            (s.sortation = 2 
                              AND (
                                  s.secretLandingKey1 IS NULL
                                  OR s.secretLandingKey2 IS NULL
                                  OR s.secretLandingKey3 IS NULL
                                  OR s.secretLandingKey4 IS NULL
                              )
                            )
                            OR 
                            (s.sortation = 1
                              AND (
                                  s.secretKey1 IS NULL
                                  OR s.secretKey2 IS NULL
                                  OR s.secretKey3 IS NULL
                                  OR s.secretKey4 IS NULL
                              )
                            )
                          ) OR 
                      s.keywordLimit = 3 AND
                          (
                            (s.sortation = 2 
                              AND (
                                  s.secretLandingKey1 IS NULL
                                  OR s.secretLandingKey2 IS NULL
                                  OR s.secretLandingKey3 IS NULL
                              )
                            )
                            OR 
                            (s.sortation = 1
                              AND (
                                  s.secretKey1 IS NULL
                                  OR s.secretKey2 IS NULL
                                  OR s.secretKey3 IS NULL
                              )
                            )
                          ) OR
                      s.keywordLimit = 2 AND
                          (
                            (s.sortation = 2 
                              AND (
                                  s.secretLandingKey1 IS NULL
                                  OR s.secretLandingKey2 IS NULL
                              )
                            )
                            OR 
                            (s.sortation = 1
                              AND (
                                  s.secretKey1 IS NULL
                                  OR s.secretKey2 IS NULL

                              )
                            )
                          )OR

                          s.keywordLimit = 1 AND
                          (
                            (s.sortation = 2 
                              AND (
                                  s.secretLandingKey1 IS NULL
                              )
                            )
                            OR 
                            (s.sortation = 1
                              AND (
                                  s.secretKey1 IS NULL
                              )
                            )
                          )
                    )
                )
                THEN 1 
            END
        ) AS error,
        COUNT(CASE WHEN s.endDate = CURDATE() THEN 1 END) AS closingToday
      FROM Slot s
      LEFT JOIN \`User\` u ON s.userId = u.seq
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
