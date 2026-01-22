import { NextResponse } from 'next/server';
import pool from 'lib/db';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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


// ✅ GET: 유저 목록 조회
export async function GET() {
  try {

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }
    const { seq, role, id } = currentUser;


      if(role == 0 ){
      const [rows] = await pool.query(
        `SELECT 
            u.seq, 
            u.id, 
            u.name, 
            u.role, 
            u.createdAt,
            u.excelAllow,
            u.slotAllow,
            u.userAllow,
            u.rankingCheckAllow,
            u.agencyId AS agencySeq,
            u.price,
            CONCAT(a.id, '(', a.name, ')') AS agencyId,
            u.distributorId AS distributorSeq,
            CONCAT(d.id, '(', d.name, ')') AS distributorId,

            (
              SELECT COUNT(*) 
              FROM \`Slot\` AS s 
              WHERE s.userId = u.seq
            ) AS slotCount

        FROM \`User\` AS u
        LEFT JOIN \`User\` AS a ON u.agencyId = a.seq
        LEFT JOIN \`User\` AS d ON u.distributorId = d.seq
        WHERE u.isDeleted = 0`
      );
      return NextResponse.json(rows);
    }else if(role ==1){
      const [rows] = await pool.query(
      `
      SELECT 
          u.seq, 
          u.id, 
          u.name, 
          u.role, 
          u.createdAt,
          u.excelAllow,
          u.slotAllow,
          u.userAllow,
          u.rankingCheckAllow,
          u.agencyId AS agencySeq,
          CONCAT(a.id, '(', a.name, ')') AS agencyId,
          u.distributorId AS distributorSeq,
          CONCAT(d.id, '(', d.name, ')') AS distributorId,

          (
            SELECT COUNT(*) 
            FROM \`Slot\` AS s 
            WHERE s.userId = u.seq
          ) AS slotCount

      FROM \`User\` AS u
      LEFT JOIN \`User\` AS a ON u.agencyId = a.seq
      LEFT JOIN \`User\` AS d ON u.distributorId = d.seq
      WHERE u.isDeleted = 0 AND (u.distributorId = ? OR u.seq = ?)
      `,
      [seq,seq] 
    );
      return NextResponse.json(rows);
    }else if(role == 2 ){
 const [rows] = await pool.query(
      `
      SELECT 
          u.seq, 
          u.id, 
          u.name, 
          u.role, 
          u.createdAt,
          u.excelAllow,
          u.slotAllow,
          u.userAllow,
          u.rankingCheckAllow,
          u.agencyId AS agencySeq,
          CONCAT(a.id, '(', a.name, ')') AS agencyId,
          u.distributorId AS distributorSeq,
          CONCAT(d.id, '(', d.name, ')') AS distributorId,

          (
            SELECT COUNT(*) 
            FROM \`Slot\` AS s 
            WHERE s.userId = u.seq
          ) AS slotCount

      FROM \`User\` AS u
      LEFT JOIN \`User\` AS a ON u.agencyId = a.seq
      LEFT JOIN \`User\` AS d ON u.distributorId = d.seq
      WHERE u.isDeleted = 0 AND (u.agencyId = ? OR u.seq = ?)
      `,
      [seq,seq] 
    );
      return NextResponse.json(rows);
    }else if(role ==3){
      const [rows] = await pool.query(
        `
        SELECT 
            u.seq, 
            u.id, 
            u.name, 
            u.role, 
            u.createdAt,
            u.excelAllow,
            u.slotAllow,
            u.userAllow,
            u.rankingCheckAllow,
            u.agencyId AS agencySeq,
            CONCAT(a.id, '(', a.name, ')') AS agencyId,
            u.distributorId AS distributorSeq,
            CONCAT(d.id, '(', d.name, ')') AS distributorId,

            (
              SELECT COUNT(*) 
              FROM \`Slot\` AS s 
              WHERE s.userId = u.seq
            ) AS slotCount

        FROM \`User\` AS u
        LEFT JOIN \`User\` AS a ON u.agencyId = a.seq
        LEFT JOIN \`User\` AS d ON u.distributorId = d.seq
        WHERE u.isDeleted = 0AND u.seq = ?
        `,
        [seq] 
      );
      return NextResponse.json(rows);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('유저 조회 실패:', error);
    return NextResponse.json({ error: '유저 조회 실패' }, { status: 500 });
  }
}

// ✅ POST: 새 유저 추가
export async function POST(request: Request) {
  try {
    const {
      id,
      name,
      password,
      role,
      creatorSeq,
      excelAllow,
      rankingCheckAllow,
      slotAllow,
      userAllow,
      agencySeq,
      distributorSeq,
      price
    } = await request.json();

    if (!id || !name || !password || creatorSeq === undefined) {
      return NextResponse.json({ message: '모든 필드를 입력하세요.' }, { status: 400 });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 생성자 정보 조회
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT seq, role FROM \`User\` WHERE seq = ? AND isDeleted = 0`,
      [creatorSeq]
    );
    const creator = rows[0];

    if (!creator) {
      return NextResponse.json({ error: '생성자를 찾을 수 없습니다.' }, { status: 400 });
    }

    let agencyId: number | null = null;
    let distributorId: number | null = null;
    
    if (creator.role === 0) {
      // 관리자 → 제한 없이 생성 가능

      agencyId = agencySeq || null;
      distributorId = distributorSeq || null;
    } else if (creator.role === 1) {
      // 총판(distributor) → 대행(2), 클라이언트(3) 생성 가능


      if (role === 2 || role === 3) {
        distributorId = creator.seq; // ✅ 총판이면 distributorId에만 넣는다
        agencyId = agencySeq || null;
      } else {
        return NextResponse.json({ error: '총판은 대행 또는 사용자만 생성 가능합니다.' }, { status: 403 });
      }
    } else if (creator.role === 2) {
      // 대행(agency) → 클라이언트만 생성 가능
      if (role === 3) {
        agencyId = creator.seq;
    
        // ✅ 대행이 소속된 총판의 seq를 조회
        const [agencyRows] = await pool.query<mysql.RowDataPacket[]>(
          `SELECT distributorId FROM \`User\` WHERE seq = ? AND isDeleted = 0`,
          [creator.seq]
        );
    
        if (agencyRows.length > 0) {
          distributorId = agencyRows[0].distributorId ?? null;
        }
      } else {
        return NextResponse.json({ error: '대행은 클라이언트만 생성 가능합니다.' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: '해당 권한으로는 유저를 생성할 수 없습니다.' }, { status: 403 });
    }
    
    // 유저 추가
    const query = `
      INSERT INTO \`User\` (id, name, password, role, agencyId, distributorId,excelAllow,rankingCheckAllow,slotAllow,userAllow,price)
      VALUES (?, ?, ?, ?, ?, ?,?,?,?,?,?)
    `;
    const params = [id, name, hashedPassword, role, agencyId, distributorId,excelAllow,rankingCheckAllow,slotAllow,userAllow,price];

    await pool.query(query, params);
    return NextResponse.json({ message: '유저가 성공적으로 추가되었습니다.' });
  } catch (error:any) {
    console.error('유저 추가 오류:', error);
    if (error.code === 'ER_DUP_ENTRY' && error.errno === 1062) {
    // 중복 키 에러일 때
    return NextResponse.json(
      { error: '아이디는 중복될 수 없습니다.' },
      { status: 400 }
    );
  }

  // 그 외 서버 오류
  return NextResponse.json(
    { error: '유저 추가 중 서버 오류 발생' },
    { status: 500 }
  );
  }
}


