import { NextResponse } from 'next/server';
import pool from 'lib/db';

// ✅ 총판 및 대행사 수정 API
export async function PUT(request: Request) {
  try {
    const { userSeq, editorSeq, userAllow, slotAllow,excelAllow ,additionalRegAllow,rankingCheckAllow} = await request.json();

    if (!userSeq || !editorSeq) {
      return NextResponse.json({ message: 'userSeq와 editorSeq가 필요합니다.' }, { status: 400 });
    }

    // 편집자 정보 조회
    const [rows] = await pool.query('SELECT seq, role FROM `User` WHERE seq = ? AND isDeleted = 0', [editorSeq]);
    const editor = (rows as any)[0];

    if (!editor) {
      return NextResponse.json({ error: '편집자를 찾을 수 없습니다.' }, { status: 403 });
    }

    // 대상 사용자 정보 조회
    const [userRows] = await pool.query(
      'SELECT seq, agencyId, distributorId FROM `User` WHERE seq = ? AND isDeleted = 0',
      [userSeq]
    );
    const targetUser = (userRows as any)[0];

    if (!targetUser) {
      return NextResponse.json({ error: '수정 대상 사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (userAllow !== null && userAllow !== undefined) {
      updateFields.push('userAllow = ?');
      updateValues.push(userAllow);
    }
    if (slotAllow !== null && slotAllow !== undefined) {
      updateFields.push('slotAllow = ?');
      updateValues.push(slotAllow);
    }
   if (excelAllow !== null && excelAllow !== undefined) {
      updateFields.push('excelAllow = ?');
      updateValues.push(excelAllow);
    }

    if (additionalRegAllow !== null && additionalRegAllow !== undefined) {
      updateFields.push('additionalRegAllow = ?');
      updateValues.push(additionalRegAllow);
    }


    
    if(rankingCheckAllow !== null && rankingCheckAllow !== undefined) {
      updateFields.push('rankingCheckAllow = ?');
      updateValues.push(rankingCheckAllow);
    }

    // 업데이트할 필드가 없으면 작업 중단
    if (updateFields.length === 0) {
      return NextResponse.json({ message: '변경할 권한이 없습니다.' }, { status: 400 });
    }

    updateValues.push(userSeq);

    const query = `UPDATE \`User\` SET ${updateFields.join(', ')} WHERE seq = ?`;

    if (editor.role === 0) {
      await pool.query(query, updateValues);
    }  else {  // 관리자 이외 권한 수정 제한
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({ message: '사용자 권한이 업데이트되었습니다.' });

  } catch (error) {
    console.error('업데이트 오류:', error);
    return NextResponse.json({ error: '업데이트 중 오류 발생' }, { status: 500 });
  }
}