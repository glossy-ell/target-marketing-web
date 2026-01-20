import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_key');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  const loginPage = '/';
  const protectedPaths = ['/slot-management', 'add-slot', '/user-management', '/log'];

  if (!token) {
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL(loginPage, request.url));
    }
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, secret);
  } catch (e) {
    if (protectedPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL(loginPage, request.url));
    }
    return NextResponse.next();
  }

  if (pathname === loginPage) {
    return NextResponse.redirect(new URL('/slot-management', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/slot-management/:path*', '/add-slot/:path*', '/user-management/:path*', '/log/:path*'],
};
