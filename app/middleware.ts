import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // 🚨 If the user is on coding.gyra.ng, rewrite to the /coding route
  if (hostname.startsWith('coding.gyra.ng')) {
    return NextResponse.rewrite(new URL('/coding', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/',
}