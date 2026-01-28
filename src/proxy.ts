import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const currentUser = request.cookies.get('currentUser')?.value

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-url', request.url)

  const { pathname } = request.nextUrl

  if (currentUser && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!currentUser && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|webp|svg|ico|gif)$).*)']
}
