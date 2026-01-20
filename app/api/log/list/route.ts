// /app/api/slots/route.ts
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

// GET - 로그 목록 조회 
export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { seq, role } = currentUser;
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '20');
    const keyword = searchParams.get('keyword') || searchParams.get('search') || '';
    const offset = (page - 1) * pageSize;

    const params: any[] = [];
    let whereClause = 'WHERE 1=1';

    if (role === 1) {
      whereClause += ' AND (l.distributor = ? OR l.user = ?)';
      params.push(seq, seq);
    } else if (role === 2) {
      whereClause += ' AND (l.agency = ? OR l.user = ?)';
      params.push(seq, seq);
    } else if (role === 3) {
      whereClause += ' AND l.user = ?';
      params.push(seq);
    }

    const [rows] = await pool.query(
      `SELECT 
        l.seq, 
        l.keywordLimit AS keywordLimit,
        l.created_at AS createdAt, 
        l.type,
        l.refund_at AS refundAt,
        CONCAT(a.name, ' (', a.id, ')') AS agency,
        CONCAT(d.name, ' (', d.id, ')') AS distributor,
        CONCAT(u.name, ' (', u.id, ')') AS user,
        l.adjustment_day AS adjustmentDay,
        l.slot_seq AS slotSeq,
        l.start_at AS startAt,
        l.end_at AS endAt,
        l.adjustmentPrice,
        l.adjustmentPriceAgency,
        l.adjustmentPriceUser,
        l.refundPrice,
        l.refundPriceAgency,
        l.refundPriceUser
      FROM Log l 
      LEFT JOIN \`User\` u ON l.user = u.seq
      LEFT JOIN \`User\` a ON l.agency = a.seq
      LEFT JOIN \`User\` d ON l.distributor = d.seq
      ${whereClause}
      ORDER BY l.seq DESC
      LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM Log l 
       ${whereClause}`,
      params
    );

    const total = (countRows as any)[0].total;
    const totalPages = Math.ceil(total / pageSize);

    // 공통 조건 로직
    const conditionMap:Record<number, string> = {
      1: `(l.distributor = ? OR l.user = ?)`,
      2: `(l.agency = ? OR l.user = ?)`,
      3: `l.user = ?`
    };

    // 전체 수량
    let totalQuery = `SELECT COUNT(*) as total FROM Log l where true`;
    const totalParams: any[] = [];
    if (conditionMap[role]) {
      totalQuery += ` AND ${conditionMap[role]}`;
      totalParams.push(...(role === 3 ? [seq] : [seq, seq]));
    }
    const [totalRows]: [any[], any] = await pool.query(totalQuery, totalParams);


    // 발행 수량
    let issuedQuery = `SELECT COUNT(*) as issued FROM Log l WHERE l.type = 1`;
    const issuedParams: any[] = [];
    if (conditionMap[role]) {
      issuedQuery += ` AND ${conditionMap[role]}`;
      issuedParams.push(...(role === 3 ? [seq] : [seq, seq]));
    }
    const [issuedRows]: [any[], any] = await pool.query(issuedQuery, issuedParams);

    // 환불 수량

    let refundQuery = `SELECT COUNT(*) as refund FROM Log l WHERE l.type = 3`;
    const refundParams: any[] = [];
    if (conditionMap[role]) {
      refundQuery += ` AND ${conditionMap[role]}`;
      refundParams.push(...(role === 3 ? [seq] : [seq, seq]));
    }
    const [refundRows]: [any[], any] = await pool.query(refundQuery, refundParams);

    // 철회 수량
    let cancelQuery = `SELECT COUNT(*) as cancel FROM Log l WHERE l.type = 4`;
    const cancelParams: any[] = [];
    if (conditionMap[role]) {
      cancelQuery += ` AND ${conditionMap[role]}`;
      cancelParams.push(...(role === 3 ? [seq] : [seq, seq]));
    }
    
    const [cancelRows]: [any[], any] = await pool.query(cancelQuery, cancelParams);

  

    // 집계
    const totalCount = Number(totalRows[0]?.total ?? 0);
    const totalIssuedCount = Number(issuedRows[0]?.issued ?? 0);
    const totalRefundCount = Number(refundRows[0]?.refund ?? 0);
    const totalCancelCount = Number(cancelRows[0]?.cancel ?? 0);

    const totalSettlement = Math.max(0, totalIssuedCount - totalRefundCount - totalCancelCount);
    

    //가격 합계 구하기
    const issuedSumBaseQuery = `
      SELECT 
        SUM(l.adjustmentPrice) AS totalAdjustmentPrice,
        SUM(l.adjustmentPriceAgency) AS totalAdjustmentPriceAgency,
        SUM(l.adjustmentPriceUser) AS totalAdjustmentPriceUser
      FROM Log l
      LEFT JOIN \`User\` u ON l.user = u.seq
      LEFT JOIN \`User\` a ON l.agency = a.seq
      LEFT JOIN \`User\` d ON l.distributor = d.seq
    `;

    let issuedSumWhereClause = `${whereClause}  AND l.type = 1`;
    if (conditionMap[role]) {
      issuedSumWhereClause += ` AND ${conditionMap[role]}`;
    }

    const issuedSumParams = role === 0
      ? [...params]
      : [...params, ...(role === 3 ? [seq] : [seq, seq])];
    const issuedSumQuery = issuedSumBaseQuery + '\n' + issuedSumWhereClause;

  
    const [issuedSumRows]: [any[], any] = await pool.query(issuedSumQuery, issuedSumParams);


    const totalIssuedSum = Number(issuedSumRows[0]?.totalAdjustmentPrice ?? 0);
    const totalIssuedSumAgency = Number(issuedSumRows[0]?.totalAdjustmentPriceAgency ?? 0);
    const totalIssuedSumUser = Number(issuedSumRows[0]?.totalAdjustmentPriceUser ?? 0);


    const refundSumBaseQuery = `
      SELECT 
      SUM(l.refundPrice) AS totalRefundPrice,
      SUM(l.refundPriceAgency) AS totalRefundPriceAgency,
      SUM(l.refundPriceUser) AS totalRefundPriceUser
      FROM Log l
      LEFT JOIN \`User\` u ON l.user = u.seq
      LEFT JOIN \`User\` a ON l.agency = a.seq
      LEFT JOIN \`User\` d ON l.distributor = d.seq
     `;
    
    let refundSumWhereClause = `${whereClause}  AND (l.type = 3 OR l.type = 4 )`;
    if (conditionMap[role]) {
      refundSumWhereClause += ` AND ${conditionMap[role]}`;
    }
    const refundSumParams = role === 0
      ? [...params]
      : [...params, ...(role === 3 ? [seq] : [seq, seq])];

    const refundSumQuery = refundSumBaseQuery + '\n' + refundSumWhereClause;

  
    const [refundSumRows]: [any[], any] = await pool.query(refundSumQuery, refundSumParams);

    const refundIssuedSum = Number(refundSumRows[0]?.totalRefundPrice ?? 0);
    const refundIssuedSumAgency = Number(refundSumRows[0]?.totalRefundPriceAgency ?? 0);
    const refundIssuedSumUser = Number(refundSumRows[0]?.totalRefundPriceUser ?? 0);



    
    return NextResponse.json({
      data: rows,
      totalPages,

      totalCount,
      totalIssuedCount,
      totalRefundCount,
      totalCancelCount,
      totalSettlement,
      
      totalIssuedSum,
      totalIssuedSumAgency,
      totalIssuedSumUser,
      refundIssuedSum,
      refundIssuedSumAgency,
      refundIssuedSumUser,
    });

  } catch (error: any) {
    console.error('로그 조회 실패:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
