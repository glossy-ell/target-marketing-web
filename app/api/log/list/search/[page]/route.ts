// /app/api/slots/route.ts
import { NextRequest, NextResponse } from 'next/server';
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

// SEARCH - 슬롯 목록 검색  
export async function POST(request: NextRequest, { params }: { params: { page: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }

    const { page } = await params || "1";

    const form = await request.formData();
    const { seq, role, id } = currentUser;
    const { searchParams } = new URL(request.url);


    let pageCount = Number(form.get("pageCount")) || 20;
    if(pageCount == -1) // 엑셀일경우
      pageCount = 999999; //전체 다운로드

    const logType = Number(form.get("logType")) || 0;

    const searchTotalIssued = Number(form.get("searchTotalIssued")) || 0;
    const searchTotalRefund = Number(form.get("searchTotalRefund")) || 0;
    const searchTotalCancel = Number(form.get("searchTotalCancel")) || 0;
    const searchTotalSettle = Number(form.get("searchTotalSettle")) || 0;

    const distributor = form.get("distributor") || null;
    const agency = form.get("agency") || null;
    const user = form.get("user") || null;

    const startDate = form.get("startDate") || null;
    const endDate = form.get("endDate") || null;

    const slotStartDate = form.get("slotStartDate") || null;
    const slotEndDate = form.get("slotEndDate") || null;

    const offset = (Number(page) - 1) * pageCount;



    const sqlParams: any[] = [];
    let whereClause = 'WHERE 1=1';

    if (role === 1) {
      whereClause += ' AND (l.distributor = ? OR l.user = ?)';
      sqlParams.push(seq, seq);
    } else if (role === 2) {
      whereClause += ' AND (l.agency = ? OR l.user = ?)';
      sqlParams.push(seq, seq);
    } else if (role === 3) {
      whereClause += ' AND l.user = ?';
      sqlParams.push(seq);
    }

    if (distributor) {
      whereClause += ' AND (l.distributor = ? )';
      sqlParams.push(distributor);
    }

    if (agency) {
      whereClause += ' AND (l.agency = ?)';
      sqlParams.push(agency);
    }

    if (user) {
      whereClause += ' AND l.user = ?';
      sqlParams.push(user);
    }

    if (Number(logType) != 0) {
      whereClause += ' AND l.type = ?';
      sqlParams.push(logType);
    }
    if (startDate) {
      whereClause += ' AND DATE(l.created_at) >= ?';
      sqlParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(l.created_at) <= ?';
      sqlParams.push(endDate);
    }

    if (slotStartDate) {
      whereClause += ' AND DATE(l.start_at) >= ?';
      sqlParams.push(slotStartDate);
    }

    if (slotEndDate) {
      whereClause += ' AND DATE(l.start_at) <= ?';
      sqlParams.push(slotEndDate);
    }

    if(searchTotalIssued){
      whereClause += ' AND l.type = 1';
    }else if(searchTotalRefund){
      whereClause += ' AND l.type = 3';
    }else if(searchTotalCancel){
      whereClause += ' AND  l.type = 4';
    }else if(searchTotalSettle){
      whereClause += ' AND l.type != 3 AND l.type !=4';
    }
    const [rows] = await pool.query(
      `SELECT 
        l.seq, 
        l.created_at AS createdAt, 
        l.refund_at AS refundAt, 
        l.type,
        l.agency,
        l.distributor,
        l.user,
        CONCAT(a.name, ' (', a.id, ')') AS agency,
        CONCAT(d.name, ' (', d.id, ')') AS distributor,
        CONCAT(u.name, ' (', u.id, ')') AS user,
        l.adjustment_day AS adjustmentDay,
        l.slot_seq AS slotSeq,
        l.start_at AS startAt,
        l.end_at AS endAt,
      FROM Log l 
      LEFT JOIN \`User\` u ON l.user = u.seq
      LEFT JOIN \`User\` a ON l.agency = a.seq
      LEFT JOIN \`User\` d ON l.distributor = d.seq
      ${whereClause}
      ORDER BY l.seq DESC
      LIMIT ? OFFSET ?
      `,
      [...sqlParams, pageCount, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total 
       FROM Log l  
       ${whereClause}`,
      sqlParams
    );

    
    const total = (countRows as any)[0].total;
    const totalPages = Math.ceil(total / pageCount);


    const baseCountQuery = `
        SELECT COUNT(*) as count
        FROM Log l 
        LEFT JOIN \`User\` u ON l.user = u.seq
        LEFT JOIN \`User\` a ON l.agency = a.seq
        LEFT JOIN \`User\` d ON l.distributor = d.seq
      `;

 
    const conditionMap: Record<number, string> = {
      1: `(l.distributor = ? OR l.user = ?)`,
      2: `(l.agency = ? OR l.user = ?)`,
      3: `l.user = ?`
    };

    let issuedWhereClause = `${whereClause}  AND l.type = 1`;
    if (conditionMap[role]) {
      issuedWhereClause += ` AND ${conditionMap[role]}`;
    }
    const issuedParams = role === 0
      ? [...sqlParams]
      : [...sqlParams, ...(role === 3 ? [seq] : [seq, seq])];

    const issuedQuery = baseCountQuery + '\n' + issuedWhereClause;

   

    const [issuedRows]: [any[], any] = await pool.query(issuedQuery, issuedParams);



    let refundWhereClause = `${whereClause} AND l.type = 3`;
    if (conditionMap[role]) {
      refundWhereClause += ` AND ${conditionMap[role]}`;
    }
    const refundParams = role === 0
      ? [...sqlParams]
      : [...sqlParams, ...(role === 3 ? [seq] : [seq, seq])];

    const refundQuery = baseCountQuery + '\n' + refundWhereClause;
    

    const [refundRows]: [any[], any] = await pool.query(refundQuery, refundParams);
    

    let cancelWhereClause = `${whereClause} AND l.type = 4`;
    if (conditionMap[role]) {
      cancelWhereClause += ` AND ${conditionMap[role]}`;
    }
    const cancelParams = role === 0
      ? [...sqlParams]
      : [...sqlParams, ...(role === 3 ? [seq] : [seq, seq])];


    const cancelQuery = baseCountQuery + '\n' + cancelWhereClause;
    const [cancelRows]: [any[], any] = await pool.query(cancelQuery, cancelParams);




    const totalIssuedCount = Number(issuedRows[0]?.count ?? 0);
    const totalRefundCount = Number(refundRows[0]?.count ?? 0);
    const totalCancelCount = Number(cancelRows[0]?.count ?? 0);
    const totalSettlement = Math.max(0, totalIssuedCount - totalRefundCount - totalCancelCount);


   
    return NextResponse.json({ 
      data: rows,
      totalPages,     
      totalIssuedCount,
      totalRefundCount,
      totalCancelCount,
      totalSettlement,
    });

  } catch (error: any) {
    console.error('로그 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
}



