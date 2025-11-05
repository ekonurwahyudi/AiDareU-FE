import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get hostname from X-Forwarded-Host (set by Cloudflare Worker) or Host header
  const xForwardedHost = request.headers.get('x-forwarded-host')
  const xOriginalHost = request.headers.get('x-original-host')
  const hostHeader = request.headers.get('host')

  const hostname = xForwardedHost || xOriginalHost || hostHeader || ''

  // Debug logging - IMPORTANT for troubleshooting
  console.log('============ MIDDLEWARE DEBUG ============')
  console.log('X-Forwarded-Host:', xForwardedHost)
  console.log('X-Original-Host:', xOriginalHost)
  console.log('Host:', hostHeader)
  console.log('Final Hostname:', hostname)
  console.log('Path:', pathname)
  console.log('Full URL:', request.url)
  console.log('==========================================')


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

  console.log('Parts:', parts)
  console.log('Is Subdomain?:', isSubdomain)
  console.log('Parts length:', parts.length)

  // If this is a subdomain and path doesn't already start with /s/
  if (isSubdomain && !pathname.startsWith('/s/')) {
    const subdomain = parts[0]

    console.log('Extracted subdomain:', subdomain)

    // Reserved subdomains - pass through
    const reserved = ['www', 'api', 'admin', 'mail', 'ftp']
    if (reserved.includes(subdomain)) {
      console.log('Reserved subdomain, passing through')
      return NextResponse.next()
    }

    // Rewrite to /s/[subdomain]/[path]
    // This is INTERNAL - browser URL stays unchanged
    const newPath = `/s/${subdomain}${pathname}`
    console.log('✅ REWRITING TO:', newPath)

    // Use NextResponse.rewrite for INTERNAL rewriting
    // Browser will NOT see this change in URL
    return NextResponse.rewrite(new URL(newPath, request.url))
  }

  console.log('❌ NOT REWRITING - No subdomain detected or already at /s/ path')
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
