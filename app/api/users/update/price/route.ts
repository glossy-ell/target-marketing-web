import { NextResponse } from 'next/server';
import pool from 'lib/db';

//  총판 및 대행 수정 API
export async function PUT(request: Request) {
  try {
    const { userSeq, editorSeq } = await request.json();

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

    


    updateValues.push(userSeq);
    const query = `UPDATE \`User\` SET ${updateFields.join(', ')} WHERE seq = ?`;

    if (editor.role === 0 || (editor.seq == targetUser.distributorId) || (editor.seq == targetUser.agencyId)) {
      await pool.query(query, updateValues);
    } else {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({ message: '총판 가격이 업데이트되었습니다.' });

  } catch (error) {
    console.error('업데이트 오류:', error);
    return NextResponse.json({ error: '업데이트 중 오류 발생' }, { status: 500 });
  }
}