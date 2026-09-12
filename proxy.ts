import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = new Set(['/coupon', '/admin/coupons'])

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname.replace(/\/$/, '') || '/'
  if (!publicRoutes.has(pathname)) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
