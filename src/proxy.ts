import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  
  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = await decrypt(sessionCookie.value);
    
    // Check role-based access
    if (request.nextUrl.pathname.startsWith('/dashboard/admin') && session.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login?error=Unauthorized', request.url));
    }

    if (request.nextUrl.pathname.startsWith('/dashboard/gifter') && session.role !== 'GIFTER') {
        return NextResponse.redirect(new URL('/login?error=Unauthorized', request.url));
    }

    return NextResponse.next();
  } catch (e) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};