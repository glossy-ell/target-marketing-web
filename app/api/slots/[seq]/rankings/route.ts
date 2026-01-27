import { NextResponse } from 'next/server';
import pool from 'lib/db';

export async function GET(_: Request, { params }: { params: { seq: string } }) {
  try {
    const [slotRows] = await pool.query<any[]>(
      `SELECT keyword,singleLink, createdAt FROM \`Slot\` WHERE seq = ?`,
      [params.seq]
    );

    const slot = slotRows[0];


    const createdAt  = [slot.createdAt];

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; 

    const dayDiff = createdAt.map((date) => {
      const dateOnly = date.toISOString().split("T")[0];

      if (dateOnly === todayStr) {
        return 1; // 오늘 날짜면 1
      } else {
        const date = new Date(dateOnly);
        const todayDate = new Date(todayStr);

        const diffTime = todayDate.getTime() - date.getTime(); // 밀리초 차이
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) +1; // 일 단위 변환
        return diffDays;
      }
    })[0];


    // keyword가  일치하는 slot_ranking 가져오기
    let query = `
     SELECT seq, ranking, keyword, singleLink, comparePriceLink, created
      FROM (
          SELECT *,
          ROW_NUMBER() OVER (
           PARTITION BY DATE(created), keyword, singleLink, NULLIF(comparePriceLink, '')
           ORDER BY created DESC
         ) AS rn
          FROM slot_ranking
          WHERE keyword = ?
      ) t
      WHERE rn = 1
    `;
    const sqlParams = [slot.keyword];
   

    // singleLink 처리
    if (slot.singleLink === null || slot.singleLink === undefined) {
      query += ' AND singleLink IS NULL';
    } else {
      query += ' AND singleLink = ?';
      sqlParams.push(slot.singleLink);
    }

    // comparePriceLink 처리 (null 또는 빈 문자열을 동일하게 취급)
    if (slot.comparePriceLink === null || slot.comparePriceLink === undefined || slot.comparePriceLink === '') {
      query += " AND (comparePriceLink IS NULL OR comparePriceLink = '')";
    } else {
      query += ' AND comparePriceLink = ?';
      sqlParams.push(slot.comparePriceLink);
    }

    query += ' ORDER BY created DESC LIMIT ?';
    sqlParams.push(dayDiff);
    const [rows] = await pool.query(
      query,
      sqlParams
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('슬롯 순위 조회 오류:', error);
    return NextResponse.json({ error: '슬롯 순위 조회 실패' }, { status: 500 });
  }
}
