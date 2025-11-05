import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Debug logging
  console.log('============ MIDDLEWARE DEBUG ============')
  console.log('Path:', pathname)
  console.log('Full URL:', request.url)

  // IMPORTANT: Cloudflare Worker already rewrites subdomain.aidareu.com to aidareu.com/s/subdomain
  // Middleware should just PASS THROUGH - no rewriting needed!

  // If path already starts with /s/, it came from Worker - just pass through
  if (pathname.startsWith('/s/')) {
    console.log('✅ Path already has /s/ prefix (from Worker) - PASS THROUGH')
    return NextResponse.next()
  }

  // Skip API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    console.log('✅ Static/API route - PASS THROUGH')
    return NextResponse.next()
  }

  console.log('✅ Regular route - PASS THROUGH')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all requests including root path
     * EXCEPT: api routes, static files, images
     */
    '/',
    '/((?!api|_next|favicon.ico|.*\\.).*)',
  ]
}
