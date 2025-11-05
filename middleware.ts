import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  console.log('Middleware - Host:', hostname)
  console.log('Middleware - Path:', pathname)

  // PRIORITY 1: API proxy requests
  if (pathname.startsWith('/api/proxy/')) {
    const backendBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
    const apiPath = pathname.replace('/api/proxy', '')
    const targetUrl = `${backendBase}${apiPath}`

    const url = new URL(targetUrl)
    // Preserve query params
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    return NextResponse.rewrite(url)
  }

  // PRIORITY 2: Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Any file extension (js, css, png, etc.)
  ) {
    return NextResponse.next()
  }

  // PRIORITY 3: Subdomain routing
  // Extract subdomain from hostname
  const parts = hostname.split('.')

  // Check if this is a tenant subdomain
  // Examples:
  // - belidisiniaja.aidareu.com -> parts = ['belidisiniaja', 'aidareu', 'com'] (3 parts)
  // - localhost -> parts = ['localhost'] (1 part, skip)
  // - www.aidareu.com -> parts = ['www', 'aidareu', 'com'] (reserved, skip)
  const isSubdomain = parts.length >= 3 &&
                     !hostname.startsWith('www.') &&
                     !hostname.startsWith('api.')

  // If this is a tenant subdomain AND path doesn't already start with /s/
  if (isSubdomain && !pathname.startsWith('/s/')) {
    const subdomain = parts[0]

    // Reserved subdomains - pass through without rewrite
    const reserved = ['www', 'api', 'admin', 'mail', 'ftp']
    if (reserved.includes(subdomain)) {
      console.log('Reserved subdomain, passing through')
      return NextResponse.next()
    }

    // Rewrite to /s/[subdomain]/[...path]
    // Examples:
    // - belidisiniaja.aidareu.com/ -> /s/belidisiniaja
    // - belidisiniaja.aidareu.com/product-slug -> /s/belidisiniaja/product-slug
    const newPath = `/s/${subdomain}${pathname}`

    console.log('Rewriting to:', newPath)

    // Create rewrite URL (internal, not visible to browser)
    const rewriteUrl = new URL(newPath, request.url)

    // Preserve query params
    searchParams.forEach((value, key) => {
      rewriteUrl.searchParams.set(key, value)
    })

    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/proxy).*)',
  ]
}
