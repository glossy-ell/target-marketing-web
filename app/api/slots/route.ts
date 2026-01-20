// /app/api/slots/route.ts
import { NextResponse } from 'next/server';
import pool from 'lib/db';

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { ResultSetHeader } from 'mysql2';
import { setDefaultAutoSelectFamily } from 'net';

// 유저 인증 - JWT 쿠키 기반
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return { seq: decoded.seq, role: decoded.role, id: decoded.id, };
  } catch (err) {
    return null;
  }
}

// GET - 슬롯 목록 조회 (검색 + 필터 + 페이지네이션)
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { seq, role } = currentUser;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');

    const keyword = searchParams.get('keyword') || searchParams.get('search') || '';

    const rankOption =  Number(searchParams.get('rankOption') || '0');

    
    const slotSearchType=  Number(searchParams.get('slotSearchType') || '1');

    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * pageSize;

    const params: any[] = [];
    let whereClause = 'WHERE 1=1';

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

    if (keyword) {
      whereClause += ` AND (
        s.productLink LIKE ? OR
        s.keyword LIKE ? OR
        u.id LIKE ? OR 
        s.singleLink LIKE ? OR
        s.productLink LIKE ? 
      )`;
      params.push(
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
        `%${keyword}%`,
      );
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
    whereClause += ' AND s.endDate >= CURDATE()'; // 만료 슬롯 제외
    //검색타입
    if(slotSearchType !=0){// 전체
        if(slotSearchType ==1){  //정상
          whereClause += ` AND DATE_SUB(s.startDate, INTERVAL 1 DAY) <= CURDATE() AND s.endDate >= CURDATE()  AND s.status = true AND NOT 
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
        )`;
        }else if(slotSearchType ==2){ //오류
          whereClause += `AND (s.status = false or s.sortation = 0 OR COALESCE(s.productPrice, 0) <= 0  

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
          ) `;
        }else if (slotSearchType == 3){ //대기
          whereClause += `
              AND s.status = false
              AND s.rank IS NULL
              AND NOT (
                 (s.singleLink IS NOT NULL AND s.singleLink LIKE '%.brand%')
                AND s.productLink IS NULL
              )
            `;
        }
        else if (slotSearchType == 4){ //마감예정
          whereClause += ' AND s.endDate = CURDATE() ';
        }
    }

    let fromClause = `
      FROM Slot s
      LEFT JOIN \`User\` u ON s.userId = u.seq
      LEFT JOIN \`User\` a ON s.agencyId = a.seq
      LEFT JOIN \`User\` d ON s.distributorId = d.seq
    `;

    if(rankOption == 1){
      fromClause += `
        JOIN (
          WITH RankedSlot AS (
            SELECT
              sr.singleLink,
              sr.keyword,
              sr.ranking,
              sr.productLink,
              DATE(sr.created) AS rankDate,
              sr.created,
              ROW_NUMBER() OVER (
                PARTITION BY sr.singleLink, sr.keyword, DATE(sr.created)
                ORDER BY sr.created DESC
              ) AS rn
            FROM slot_ranking sr
          )
          SELECT
            today.singleLink,
            today.productLink,
            today.keyword
          FROM RankedSlot today
          JOIN RankedSlot yesterday
            ON today.singleLink <=> yesterday.singleLink
            AND today.keyword <=> yesterday.keyword
            AND today.productLink <=> yesterday.productLink
          WHERE
            today.rn = 1
            AND yesterday.rn = 1
            AND DATE(today.rankDate) = CURDATE()
            AND DATE(yesterday.rankDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND (today.ranking+0) < (yesterday.ranking+0)
        ) rankFilter
        ON (
          (s.singleLink = rankFilter.singleLink OR (s.singleLink IS NULL AND rankFilter.singleLink IS NULL))
          AND
          (s.keyword = rankFilter.keyword OR (s.keyword IS NULL AND rankFilter.keyword IS NULL))
          AND
          (s.productLink = rankFilter.productLink OR (s.productLink IS NULL AND rankFilter.productLink IS NULL))
        )
      `;
    }else if(rankOption == -1){
      fromClause += `
        JOIN (
          WITH RankedSlot AS (
            SELECT
              sr.singleLink,
              sr.productLink,
              sr.keyword,
              sr.ranking,
              DATE(sr.created) AS rankDate,
              sr.created,
              ROW_NUMBER() OVER (
                PARTITION BY sr.singleLink, sr.keyword, DATE(sr.created)
                ORDER BY sr.created DESC
              ) AS rn
            FROM slot_ranking sr
          )
          SELECT
            today.singleLink,
            today.productLink,
            today.keyword
          FROM RankedSlot today
          JOIN RankedSlot yesterday
            ON today.singleLink <=> yesterday.singleLink
            AND today.keyword <=> yesterday.keyword
            AND today.productLink <=> yesterday.productLink
          WHERE
            today.rn = 1
            AND yesterday.rn = 1
            AND DATE(today.rankDate) = CURDATE()
            AND DATE(yesterday.rankDate) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND (today.ranking+0) > (yesterday.ranking + 0)
        ) rankFilter
        ON (
          (s.singleLink = rankFilter.singleLink OR (s.singleLink IS NULL AND rankFilter.singleLink IS NULL))
          AND
          (s.keyword = rankFilter.keyword OR (s.keyword IS NULL AND rankFilter.keyword IS NULL))
          AND
          (s.productLink = rankFilter.productLink OR (s.productLink IS NULL AND rankFilter.productLink IS NULL))
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
      ORDER BY s.seq DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
      ${fromClause}
       ${whereClause}`,
      params
    );

    const total = (countRows as any)[0].total;

    const totalPages = Math.ceil(total / pageSize);



    // ✅ 날짜 KST(+9시간) 변환 함수
    const convertToKSTDate = (utcDate: string) => {
      const date = new Date(utcDate);
      const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
      return kst.toISOString().split('T')[0]; // "YYYY-MM-DD"
    };

    // ✅ 모든 startDate, endDate를 KST 기준 문자열로 변환
    const convertedRows = (slots as any[]).map(row => ({
      ...row,
      startDate: row.startDate ? convertToKSTDate(row.startDate) : null,
      endDate: row.endDate ? convertToKSTDate(row.endDate) : null,
    }));

    return NextResponse.json({ data: convertedRows, totalPages });

  } catch (error: any) {
    console.error('슬롯 목록 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
}



// POST - 슬롯 추가
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
  
    const slots = await request.json();
    const values: any[] = [];

    for (const slot of slots) {
      const [userRows] = await pool.query(
        `SELECT agencyId, distributorId FROM User WHERE seq = ? LIMIT 1`,
        [slot.userId]
      );


      const user = (userRows as any[])[0];
      if (!user) {
        return NextResponse.json({ error: `유저 정보가 없음: ${slot.userId}` }, { status: 404 });
      }

      values.push([
        slot.userId,
        user.agencyId || null,
        user.distributorId || null,
        slot.startDate,
        slot.endDate,
        slot.keywordLimit,
        slot.extraTime,
      ]);
    }
  
    const query = `
      INSERT INTO Slot (userId, agencyId, distributorId, startDate, endDate,keywordLimit,extraTime)
      VALUES ?
    `;
    
    const [result] = await pool.query<ResultSetHeader>(query, [values]);

    const logQuery = `
     INSERT INTO Log (type,created_at,agency,distributor,user,slot_seq,start_at,end_at,adjustment_day,keywordLimit,adjustmentPrice,adjustmentPriceAgency,adjustmentPriceUser)
     VALUES ?
    `; // 로그 추가 

    const insertedIds = Array.from({ length: result.affectedRows }, (_, i) => result.insertId + i); //입력한 슬롯 seq 추출
    const [insertedSlots] = await pool.query<any[]>(
      `SELECT * FROM Slot WHERE seq IN (?) ORDER BY seq ASC`,
      [insertedIds]
    );
      
   
    const logValues: any[] = [];
    for (let i = 0; i < insertedSlots.length; i++) {
      const slot = insertedSlots[i];
      const insertedId = insertedIds[i];

      const adjustmentDay = Math.ceil(
        (new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      // 1. 사용자 정보 조회
      const [[user]] = await pool.query<any[]>(`
        SELECT role, price, distributorId,agencyId
        FROM User
        WHERE seq = ?
      `, [slot.userId]);

      
      let price = 0;
      let agencyPrice = 0;
      let userPrice = 0;

      let adjustmentPrice =0;
      let adjustmentPriceAgency = 0;
      let adjustmentPriceUser = 0;



      if (user) {
          if (user.role ===0 || user.role === 1) {
            // 대리점이면 본인 가격 사용
            price = user.price ?? 0;

          } else if (user.role == 2) {
            const [[distributor]] = await pool.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.distributorId]);

            

            price = distributor?.price ?? 0;
            agencyPrice = user.price ?? 0;;
            
          } else if (user.role ==3){
            const [[distributor]] = await pool.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.distributorId]);

            const [[agency]] = await pool.query<any[]>(`
              SELECT price
              FROM User
              WHERE seq = ?
            `, [user.agencyId]);

            
            price = distributor?.price ?? 0;
            agencyPrice = agency?.price ?? 0;
            userPrice = user.price ?? 0;
          }
        }

      adjustmentPrice = price * adjustmentDay;
      adjustmentPriceAgency = agencyPrice * adjustmentDay;
      adjustmentPriceUser = userPrice * adjustmentDay;

      // logValue 구성
      logValues.push([
        1,
        slot.createdAt,
        slot.agencyId || null,
        slot.distributorId || null,
        slot.userId,
        insertedId,
        slot.startDate,
        slot.endDate,
        adjustmentDay,
        slot.keywordLimit,
        adjustmentPrice,
        adjustmentPriceAgency,
        adjustmentPriceUser
      ]);
    }
      
    const [logResult] = await pool.query(logQuery, [logValues]);

    return NextResponse.json({ message: '슬롯 추가 완료', result });
  } catch (error: unknown) {
    console.error('슬롯 추가 오류:', error);
    return NextResponse.json({ error: '슬롯 추가 중 오류 발생' }, { status: 500 });
  }
}

// PUT - 슬롯  수정
export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }


    const body = await request.json();
    const { seqs, productLink, keyword, memo ,sortation,singleLink} = body;

    if (!Array.isArray(seqs) || seqs.length === 0) {
      return NextResponse.json({ error: '수정할 슬롯 ID 목록이 없습니다.' }, { status: 400 });
    }

    // // 수정할 항목이 최소 하나라도 있는지 확인
    // if (!productLink && !keyword && !singleLink && !sortation) {
    //   return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 });
    // }

    const [rows] = await pool.query<any[]>(
      `SELECT seq, productLink, keyword, singleLink, sortation,memo FROM Slot WHERE seq IN (${seqs.map(() => '?').join(',')})`,
      seqs
    );
    // 실제 수정할 값 계산
    let hasChanges = false;
    let onlyMemo = false;


    for (const row of rows) { //바뀐값 검사
      if (
        (productLink !== undefined && productLink !== row.productLink) ||
        (keyword !== undefined && keyword !== row.keyword) ||
        (singleLink !== undefined && singleLink !== row.singleLink) ||
        (sortation !== undefined && sortation !== row.sortation)||
        (memo !== undefined && memo !== row.memo)
      ) {
        hasChanges = true;
        break;
      }
    }

    for (const row of rows) { // 데이터 null 비초기화 조건 검사 
      const isProductLinkSame = productLink === undefined || productLink === row.productLink;
      const isSingleLinkSame = singleLink === undefined || singleLink === row.singleLink;
      const isSortationSame = sortation === undefined || sortation === row.sortation;
      const isDifferent = ((memo !== undefined && memo !== row.memo)  || (keyword !== undefined && keyword !== row.keyword)); // 키워드 , 메모 동시 체크 
      if (
        isProductLinkSame &&
        isSingleLinkSame &&
        isSortationSame &&
        isDifferent
      ) {
        onlyMemo= true;
        break;
      }
    }
   
    if (!hasChanges) {
      return NextResponse.json({ message: '수정할 항목이 없습니다' }, { status: 200 });
    }  //바뀐게 없을경우


    // 동적으로 SET 절 구성
    const fields: string[] = [];
    const values: any[] = [];

    if (productLink !== undefined) {
      fields.push('productLink = ?');
      values.push(productLink);
    }
    if (singleLink !== undefined) {
      fields.push('singleLink = ?');
      values.push(singleLink);
    }
    if (keyword !== undefined) {
      fields.push('keyword = ?');
      values.push(keyword);
    }
    if (memo !== undefined) {
      fields.push('memo = ?');
      values.push(memo);
    }

    if (sortation !== undefined) {
      fields.push('sortation = ?');
      values.push(sortation);
    }

    if (sortation !== undefined) {
      fields.push('sortation = ?');
      values.push(sortation);
    }


    if(!onlyMemo){ // 값변동 있을경우 api 호출값 초기화 (메모만 수정될경우 미호출)
      fields.push('storeName = ?');
      values.push(null);
      fields.push('answerTagList = ?');
      values.push(null);
      fields.push('productPrice = ?');
      values.push(null);
      fields.push('thumbnail = ?');
      values.push(null);
      fields.push('rank = ?');
      values.push(null);
      fields.push('productId = ?');
      values.push(null);
      fields.push('comparePriceLowestPrice = ?');
      values.push(null);
      fields.push('comparePriceURL = ?');
      values.push(null);
      fields.push('comparePriceSalePlaceCount = ?');
      values.push(null);


      //추가등록
      // fields.push('secretKey1 = ?');
      // values.push(null);

      // fields.push('secretKey2 = ?');
      // values.push(null);

      // fields.push('secretKey3 = ?');
      // values.push(null);

      // fields.push('secretKey4 = ?');
      // values.push(null);

      // fields.push('secretLandingKey1 = ?');
      // values.push(null);

      // fields.push('secretLandingKey2= ?');
      // values.push(null);

      // fields.push('secretLandingKey3= ?');
      // values.push(null);
      
      // fields.push('secretLandingKey4= ?');
      // values.push(null);
      //주석처리 (업체 요청)
    }

    if (typeof singleLink === 'string' && singleLink.includes(".brand") && !productLink) {
        fields.push('status = ?');
        values.push(true);
      }else{
      fields.push('status = ?');
      values.push(false);
    }

    const setClause = fields.join(', ');
    const placeholders = seqs.map(() => '?').join(',');
    values.push(...seqs); // ID 목록도 마지막에 추가

    const query = `
      UPDATE Slot
      SET ${setClause}
      WHERE seq IN (${placeholders})
    `;

    await pool.query(query, values);

    return NextResponse.json({ message: '일괄 수정 완료' });
  } catch (error: any) {
    console.error('슬롯 수정 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



// DELETE - 슬롯 삭제 (단일 및 일괄 삭제)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { seq, seqs } = body;


    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
    const { role } = currentUser;

    if(role != 0){
      return NextResponse.json({ error: '관리자 외 삭제 불가' }, { status: 403 });
    }


    if (seq) {
      console.log('단일 삭제 seq:', seq);
      await pool.query('DELETE FROM Slot WHERE seq = ?', [seq]);
      
    } else if (Array.isArray(seqs) && seqs.length > 0) {
      console.log('일괄 삭제 seqs:', seqs);
      const placeholders = seqs.map(() => '?').join(',');
      await pool.query(`DELETE FROM Slot WHERE seq IN (${placeholders})`, seqs);


    } else {
      return NextResponse.json({ error: '삭제할 seq 또는 seqs가 필요합니다.' }, { status: 400 });
    }

    return NextResponse.json({ message: '삭제 완료' });
  } catch (error: any) {
    console.error('슬롯 삭제 오류:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}