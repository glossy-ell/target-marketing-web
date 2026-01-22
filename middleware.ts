import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  const loginPage = '/';
  
  // API 라우트는 제외
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 로그인 페이지가 아닌 모든 페이지는 인증 필요
  if (pathname !== loginPage) {
    if (!token) {
      return NextResponse.redirect(new URL(loginPage, request.url));
    }

    try {
      await jwtVerify(token, secret);
    } catch (e) {
      return NextResponse.redirect(new URL(loginPage, request.url));
    }
  }

  // 이미 로그인된 사용자가 로그인 페이지에 접근하면 slot-management로 리다이렉트
  if (pathname === loginPage && token) {
    try {
      await jwtVerify(token, secret);
      return NextResponse.redirect(new URL('/slot-management', request.url));
    } catch (e) {
      // 토큰이 유효하지 않으면 로그인 페이지 표시
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/slot-management/:path*',
    '/add-slot/:path*',
    '/user-management/:path*',
    '/log/:path*',
    '/extend-management/:path*',
    '/exceldownloadpopup/:path*',
    '/excelspecdownloadpopup/:path*',
    '/exceltotaldownloadpopup/:path*',
    '/exceluploadpopup/:path*',
  ],
};
