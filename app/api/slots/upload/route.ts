import { NextResponse } from 'next/server';
import pool from 'lib/db';
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
function excelSerialToDate(serial: number): Date {
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // 엑셀 기준
  return new Date(excelEpoch.getTime() + serial * 86400000);
}
function parseExcelDate(value: any): Date | null {
  if (!value) return null;

  // 엑셀 serial number
  if (typeof value === 'number') {
    return excelSerialToDate(value);
  }

  // 문자열 날짜
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: '인증 실패' }, { status: 401 });

    const data = await request.json();
    const rows: any[] = Array.isArray(data) ? data : data.rows || [];
    if (!rows.length) return NextResponse.json({ error: '업로드할 데이터가 없습니다.' }, { status: 400 });

    const values: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const clientId = (row['클라이언트 ID'] || row['클라이언트'] || '').toString().trim();
      const keyword = (row['키워드'] || row['검색어'] || '').toString().trim();
      const mainKeyword = (row['메인 키워드'] || row['메인키워드'] || row['mainKeyword'] || '').toString().trim();
      const singleLink = row['상품 링크'] || row['상품 URL'] || '';
      const comparePriceLink = row['가격비교링크'] || '';
      const mid = row['MID'] || '';
      const startRaw = (row['시작일'] || row['시작 날짜'] || '').toString().trim();
      const endRaw = (row['종료일'] || row['종료 날짜'] || '').toString().trim();
      const memo = row['메모'] || row['memo'] || '';

      if (!clientId) {
        return NextResponse.json({ error: `행 ${i + 1}: 클라이언트 ID가 비어있습니다.` }, { status: 400 });
      }

      // date validation
      if (!startRaw || !endRaw) {
        return NextResponse.json({ error: `행 ${i + 1}: 시작일 또는 종료일이 비어있습니다.` }, { status: 400 });
      }
      const startDate = parseExcelDate(row['시작일'] || row['시작 날짜']);
      const endDate   = parseExcelDate(row['종료일'] || row['종료 날짜']);

      if (!startDate || !endDate) {
        return NextResponse.json(
          { error: `행 ${i + 1}: 날짜 형식이 잘못되었습니다.` },
          { status: 400 }
        );
      }

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: `행 ${i + 1}: 날짜 형식이 잘못되었습니다. YYYY-MM-DD 형식으로 입력하세요.` }, { status: 400 });
      }
      if (endDate.getTime() < startDate.getTime()) {
        return NextResponse.json({ error: `행 ${i + 1}: 종료일이 시작일보다 작습니다.` }, { status: 400 });
      }

      // find user
      const [userRows] = await pool.query<any[]>(`SELECT seq, agencyId, distributorId FROM \`User\` WHERE id = ? AND isDeleted = 0 LIMIT 1`, [clientId]);
      if (!userRows || userRows.length === 0) {
        return NextResponse.json({ error: `행 ${i + 1}: 클라이언트 ID(${clientId})를 찾을 수 없습니다.` }, { status: 400 });
      }

      const user = userRows[0];
      const userSeq = user.seq;
      const agencyId = user.agencyId || null;
      const distributorId = user.distributorId || null;

      const startAt = `${startDate.toISOString().split('T')[0]} 00:00:00.000`;
      const endAt = `${endDate.toISOString().split('T')[0]} 23:59:59.000`;

      values.push([
        userSeq,
        agencyId,
        distributorId,
        keyword || null,
        mainKeyword || null,
        startAt,
        endAt,
        singleLink || null,
        comparePriceLink || null,
        mid || null,
        memo || null,
      ]);
    }

    // bulk insert
    const insertQuery = `
      INSERT INTO Slot (userId, agencyId, distributorId, keyword, mainKeyword, startDate, endDate, singleLink, comparePriceLink, mid, memo)
      VALUES ?
    `;
    const [result] = await pool.query(insertQuery, [values]);

    const insertId = (result as any).insertId;
    const affected = (result as any).affectedRows || 0;

    if (affected === 0) {
      return NextResponse.json({ error: '슬롯을 추가하지 못했습니다.' }, { status: 500 });
    }

    // fetch inserted slots to create logs
    const insertedIds = Array.from({ length: affected }, (_, i) => insertId + i);
    const [insertedSlots] = await pool.query<any[]>(`SELECT * FROM Slot WHERE seq IN (?) ORDER BY seq ASC`, [insertedIds]);

    const now = new Date();
    const logRows: any[] = [];
    for (let i = 0; i < insertedSlots.length; i++) {
      const slot = insertedSlots[i];
      const insertedSeq = insertedIds[i];
      const adjustmentDay = Math.ceil((new Date(slot.endDate).getTime() - new Date(slot.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      logRows.push([
        1,
        now,
        slot.agencyId || null,
        slot.distributorId || null,
        slot.userId,
        insertedSeq,
        slot.startDate,
        slot.endDate,
        adjustmentDay,
      ]);
    }

    if (logRows.length > 0) {
      const logQuery = `
        INSERT INTO Log (type, created_at, agency, distributor, user, slot_seq, start_at, end_at, adjustment_day)
        VALUES ?
      `;
      await pool.query(logQuery, [logRows]);
    }

    return NextResponse.json({ message: '업로드 및 추가 완료', inserted: affected });
  } catch (err: any) {
    console.error('슬롯 업로드 오류:', err);
    return NextResponse.json({ error: '서버 오류입니다.' }, { status: 500 });
  }
}
