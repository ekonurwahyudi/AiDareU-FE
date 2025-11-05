import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  console.log('Middleware - Host:', hostname)
  console.log('Middleware - Path:', pathname)

  // Skip API routes and static files
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next()
  }

  // Extract subdomain from hostname
  const parts = hostname.split('.')

  // Check if this is a tenant subdomain
  // Example: serbaadaku.aidareu.com -> parts = ['serbaadaku', 'aidareu', 'com']
  const isSubdomain = parts.length >= 3 &&
                     hostname !== 'www.aidareu.com' &&
                     hostname !== 'api.aidareu.com'

  // If this is a subdomain and path doesn't already start with /s/
  if (isSubdomain && !pathname.startsWith('/s/')) {
    const subdomain = parts[0]

    // Reserved subdomains - pass through
    const reserved = ['www', 'api', 'admin', 'mail', 'ftp']
    if (reserved.includes(subdomain)) {
      return NextResponse.next()
    }

    // Rewrite to /s/[subdomain]/[path]
    // This is INTERNAL - browser URL stays unchanged
    const newPath = `/s/${subdomain}${pathname}`
    console.log('Rewriting to:', newPath)

    // Use NextResponse.rewrite for INTERNAL rewriting
    // Browser will NOT see this change in URL
    return NextResponse.rewrite(new URL(newPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
