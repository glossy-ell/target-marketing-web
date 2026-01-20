import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { use } from 'react';

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';

  const token = cookieHeader
    .split(';')
    .find((c) => c.trim().startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    return NextResponse.json({ error: '토큰 없음' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const { id, role, seq, name,excelAllow,additionalRegAllow,slotAllow,userAllow,rankingCheckAllow } = decoded as {
      id: string;
      role: number;
      seq: number;
      name: string;
      excelAllow :number;
      additionalRegAllow: number;
      slotAllow: number;
      userAllow: number;
      rankingCheckAllow : number;
    };

    return NextResponse.json({ id, role, seq, name,excelAllow,additionalRegAllow ,slotAllow,userAllow,rankingCheckAllow});
  } catch (err) {
    return NextResponse.json({ error: '토큰 유효하지 않음' }, { status: 401 });
  }
}
