import { NextResponse, type NextRequest } from 'next/server'

// Bỏ qua luồng auth server-side để vào thẳng app
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
