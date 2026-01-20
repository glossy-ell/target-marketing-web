// /api/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ message: '로그아웃 완료' });

  res.cookies.set({
    name: 'token',
    value: '',
    path: '/',
    maxAge: 0,
  });

  return res;
}
