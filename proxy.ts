import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session_user')

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/org')

  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL('/authentication', request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (request.nextUrl.pathname === '/authentication' && sessionCookie) {
    try {
      const orgName = 'abatechnology'
      return NextResponse.redirect(new URL(`/org/${orgName}/dashboard`, request.url))
    } catch {
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/org/:path*', '/authentication'],
}