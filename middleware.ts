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

  // No subdomain routing needed - Cloudflare Worker handles it
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
