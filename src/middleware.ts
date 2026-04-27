import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const protectedPaths = ['/dashboard', '/workspace'];
const authPaths = ['/auth/login', '/auth/signup'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const jwt = request.cookies.get('jwt')?.value;
    const currentUser = request.cookies.get('currentUser')?.value;
    const isAuthenticated = Boolean(jwt && currentUser);

    if (protectedPaths.some((path) => pathname.startsWith(path))) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    if (authPaths.some((path) => pathname.startsWith(path))) {
        if (isAuthenticated) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
};
