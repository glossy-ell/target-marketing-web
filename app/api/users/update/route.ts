import { NextResponse } from 'next/server';
import pool from 'lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

// ✅총판 및 대행 수정 API
export async function PUT(request: Request) {
  try {
    let { userSeq, agencySeq, distributorSeq,name,editorSeq,password,role,excelAllow,userAllow,slotAllow,rankingCheckAllow} = await request.json();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 });
    }


    if (!userSeq || !editorSeq) {
      return NextResponse.json({ message: 'userSeq와 editorSeq가 필요합니다.' }, { status: 400 });
    }

    // 🔹 요청자(편집자) 역할 확인
    const [rows] = await pool.query('SELECT seq, role FROM `User` WHERE seq = ? AND isDeleted = 0', [editorSeq]);
    const editor = (rows as any)[0];
    
    if (!editor) {
      return NextResponse.json({ error: '편집자를 찾을 수 없습니다.' }, { status: 403 });
    }

    // 🔹 대상 사용자 정보 확인
    const [userRows] = await pool.query(
      'SELECT seq, agencyId, distributorId FROM `User` WHERE seq = ? AND isDeleted = 0',
      [userSeq]
    );
    const targetUser = (userRows as any)[0];

    

    if (!targetUser) {
      return NextResponse.json({ error: '수정 대상 사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 🔥 관리자 (role: 0) → 전체 수정 가능
    if (editor.role === 0) {
      if (typeof role === 'number' && !isNaN(role)) {
        await pool.query(
          'UPDATE `User` SET agencyId = ?, distributorId = ?, role = ?,excelAllow =?,userAllow=?,slotAllow=?,rankingCheckAllow=? WHERE seq = ?',
          [
            typeof agencySeq === 'number' ? agencySeq : null,
            typeof distributorSeq === 'number' ? distributorSeq : null,
            role,
            excelAllow,
            userAllow,
            slotAllow,
            rankingCheckAllow,
            userSeq,
          ]
        );
      }else{
      await pool.query(
          'UPDATE `User` SET agencyId = ?, distributorId = ?,excelAllow =?,userAllow=?,slotAllow=?,rankingCheckAllow=? WHERE seq = ?',
          [
            typeof agencySeq === 'number' ? agencySeq: null,
            typeof distributorSeq === 'number' ? distributorSeq : null,
            excelAllow,
            userAllow,
            slotAllow,
            rankingCheckAllow,
            userSeq,
          ]
        );
      }
    }

    // 🔥 총판 (role: 1) → 본인 산하 유저의 `distributorId`만 수정 가능
    else if (editor.role === 1) {
      if ((targetUser.distributorId !== editor.seq) && (targetUser.seq !==editor.seq )) {
        return NextResponse.json(
          { error: '총판은 자기 산하의 유저만 수정할 수 있습니다.' },
          { status: 403 }
        );
      }
      if (role == 0) {
        return NextResponse.json(
          { error: '총판은 관리자로 설정할 수 없습니다.' },
          { status: 403 }
        );
      }

      if (typeof role === 'number' && !isNaN(role)) {
          await pool.query(
          'UPDATE `User` SET distributorId = ?,role = ?,excelAllow =?,userAllow=?,slotAllow=?,rankingCheckAllow=? WHERE seq = ?',
          [
            typeof distributorSeq === 'number' ? distributorSeq : null,
            role,
            excelAllow,
            userAllow,
            slotAllow,
            rankingCheckAllow,
            userSeq,
          ]
        );
      }else{
        await pool.query(
          'UPDATE `User` SET distributorId = ?,,excelAllow =?,userAllow=?,slotAllow=?,rankingCheckAllow=? WHERE seq = ?',
          [
            typeof distributorSeq === 'number' ? distributorSeq : null,
            excelAllow,
            userAllow,
            slotAllow,
            rankingCheckAllow,
            userSeq,
          ]
        );
      }
    }
    else {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }
    if(password){
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
          'UPDATE `User` SET password=? WHERE seq = ?',
          [
            hashedPassword,
            userSeq,
          ]
        );
    }
    if(name){
        await pool.query(
          'UPDATE `User` SET name=? WHERE seq = ?',
          [
            name,
            userSeq,
          ]
        );
    }

    return NextResponse.json({ message: '총판/대행 정보가 업데이트되었습니다.' });
  } catch (error) {
    console.error('업데이트 오류:', error);
    return NextResponse.json({ error: '업데이트 중 오류 발생' }, { status: 500 });
  }
}

