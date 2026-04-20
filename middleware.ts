import { NextResponse, type NextRequest } from 'next/server'

// Auth tạm thời bị tắt — cho phép tất cả request đi qua không cần đăng nhập
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
