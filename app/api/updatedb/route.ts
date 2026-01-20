import axios from 'axios';
import pool from 'lib/db';
import { RowDataPacket } from 'mysql2';
import type { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';


interface Slot extends RowDataPacket {
  seq: number;
  userId: string;
  agencyId: string;
  distributorId: string;
  productLink: string;
  keyword: string;
  startDate: string;
  endDate: string;
  rank: number;
  thumbnail: string;
  memo: string;
  productPrice: number;
  answerTagList: string;
  storeName: string;
  isOutLanding: number;
}

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    let token;
    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); //마감일 : 오늘 23시59분59초

    const params: any[] = [];

    let whereClause = 'WHERE 1=1';



  
    if (endDate) {
      whereClause += ' AND s.endDate >= ?';
      params.push(endDate);
    }

    const [rows] = await pool.query<Slot[]>(
      `SELECT 
        s.seq, 
        CONCAT(u.id, '(', u.name, ')') AS userId,
        CONCAT(a.id, '(', a.name, ')') AS agencyId,
        CONCAT(d.id, '(', d.name, ')') AS distributorId,
        s.productLink, 
        s.keyword, 
        s.startDate, 
        s.endDate, 
        s.rank,
        s.thumbnail,
        s.memo,
        s.productPrice,
        s.answerTagList,
        s.storeName,
        s.isOutLanding
      FROM Slot s
      LEFT JOIN \`User\` u ON s.userId = u.seq
      LEFT JOIN \`User\` a ON s.agencyId = a.seq
      LEFT JOIN \`User\` d ON s.distributorId = d.seq
      ${whereClause}
      ORDER BY s.seq DESC
      `,
      [...params]
    );


    const API_URL ="https://api.1stad.co.kr/token.php";
    
    const body = {
        "secret_key": "pYFcXc6ov2JlaOlzdLJ5bhwKYM3qvn8u1a+QH/xk7Vh51ieI21HzbZYRChteLYagDXQcWubarWPH77vE269mhA==",
        "user_id": "ckdgo005"
    }
    async function fetchTokenWithRetry(retryCount = 1) {
        try {
            const response = await axios.post(API_URL, body);
            return response.data.token;
        } catch (error:any) {
            if (retryCount > 0) {
                console.log("🔁 재시도 중...");
                return await fetchTokenWithRetry(retryCount - 1);
            } else {
                throw new Error("모든 요청 실패");
            }
        }
    }
    token = await fetchTokenWithRetry();
   const headers = {
      Authorization: `Bearer ${token}`,
      userid: "ckdgo005",
      "Content-Type": "application/json",
      accept: "application/json",
    };

    const singleUrl = "https://api.1stad.co.kr/shop/item_info.php" //단일
    const rankUrl = "https://api.1stad.co.kr/shop/catalog_info.php" // 순위비교

    function delay(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function processSlotsSequentially(rows: Slot[]) {
      for (const slot of rows) {
        const url = slot.productLink;
        if(!url)
            continue
        try {

          if (!url.includes('catalog')) {
            const body = { url, visit_yn: "N" };
            const response = await axios.post(singleUrl, body, { headers });
        
            const item = response?.data?.item;
            if(!item)
              continue;
            
            const storeName = item.store_name ?? null;
            const answerTagList = item.tag_list ?? [];
            const thumbnail = item.item_img ?? null;
            const productPrice = item.item_price ?? null;

            slot.storeName = storeName;
            slot.answerTagList = answerTagList;
            slot.thumbnail = thumbnail;
            slot.productPrice = productPrice;

            const sql = `
              UPDATE Slot SET
                storeName = ?,
                answerTagList = ?,
                thumbnail = ?,
                productPrice = ?
              WHERE seq = ?
            `;
            const params = [
              storeName ?? null,
              answerTagList ?? null,
              thumbnail ?? null,
              productPrice ?? null,
              slot.seq
            ];
            await pool.query(sql, params);
           
          } else {
            const body = { url };
            const response = await axios.post(rankUrl, body, { headers });

            const productPrice = response.data.item.item_price;
            const thumbnail = response.data.item.item_img;

            const sql = `
              UPDATE Slot SET
                thumbnail = ?,
                productPrice = ?
              WHERE seq = ?
            `;
            const params = [
              thumbnail ?? null,
              productPrice ?? null,
              slot.seq
            ];
            await pool.query(sql, params);
          }

          // 1초 딜레이 (조정 가능)
          await delay(1000);

        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error(`에러 (seq: ${slot.seq}):`, error.response?.data ?? error.message);
          } else {
            console.error(`에러 (seq: ${slot.seq}):`, error);
          }
        }
      }
      console.log("모든 슬롯 업데이트 완료");
    }

      // 실행 시
      await processSlotsSequentially(rows);
    



     return NextResponse.json(
        { result: "OK", message: "update success" },
        { status: 200 }
    );

  } catch (error: any) {
    console.error('슬롯 목록 조회 실패:', error);
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }

}