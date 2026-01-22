import { NextResponse } from 'next/server';
import pool from 'lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ message: '아이디와 비밀번호를 입력하세요.' }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      'SELECT seq, id, name, password, role, excelAllow,slotAllow,userAllow,rankingCheckAllow FROM `User` WHERE id = ? AND isDeleted = 0',
      [username]
    );


    if (rows.length === 0) {
      return NextResponse.json({ message: '존재하지 않는 클라이언트입니다.' }, { status: 401 });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    let agency = null;
    let distributor = null;

    if(user.agencyId != null){
      const [agencyRows]: any = await pool.query(
        'SELECT seq, id, name, password, role FROM `User` WHERE id = ? AND isDeleted = 0',
        [username]
      ); // 대행
      // if(agencyRows.length >0)
    }
    
    if(user.distributorId != null){
      const [distributorRows]: any = await pool.query(
        'SELECT seq, id, name, password, role FROM `User` WHERE id = ? AND isDeleted = 0',
        [username]
      ); //총판
    }


    const token = jwt.sign(
      { id: user.id, role: user.role, seq: user.seq, name: user.name ,excelAllow: user.excelAllow,slotAllow: user.slotAllow,userAllow: user.userAllow, rankingCheckAllow:user.rankingCheckAllow},
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const response = new NextResponse(JSON.stringify({ message: '로그인 성공' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === 'production',
      secure:false,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 2,
    });

    return response;
  } catch (error: unknown) {
    console.error('로그인 오류:', error);
    return NextResponse.json(
      { message: '서버 오류', error: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
