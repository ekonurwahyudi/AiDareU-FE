import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Check if it's development environment
  const isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1')

  // Proxy API requests
  if (pathname.startsWith('/api/proxy/')) {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
    const apiPath = pathname.replace('/api/proxy', '')
    const targetUrl = `${backendBase}/api${apiPath}`

    const url = new URL(targetUrl)
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    return NextResponse.rewrite(url)
  }

  // Handle subdomain routing (multi-tenant store)
  if (!isDevelopment) {
    // Extract main domain from NEXT_PUBLIC_FRONTEND_URL
    // Example: https://aidareu.com -> aidareu.com
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://aidareu.com'
    const mainDomain = frontendUrl.replace(/^https?:\/\//, '')

    // Extract subdomain from hostname
    // Example: serbaadaku.aidareu.com -> serbaadaku
    const hostParts = hostname.split('.')

    // Check if it's a subdomain (not www, not app, not main domain)
    if (hostParts.length >= 3 && hostParts[0] !== 'www' && hostParts[0] !== 'app' && hostname.includes(mainDomain)) {
      const subdomain = hostParts[0]

      // Don't rewrite if already in /s/ path
      if (!pathname.startsWith('/s/')) {
        // Rewrite to /s/[subdomain]/[path]
        const newPath = `/s/${subdomain}${pathname}`
        const url = request.nextUrl.clone()
        url.pathname = newPath

        return NextResponse.rewrite(url)
      }
    }
  }

  // Development: handle /s/[subdomain] paths
  // In development, we use /s/[subdomain] in the URL
  // In production, subdomain.aidareu.com rewrites to /s/subdomain

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|images|.*\\..*).*)' // Match all except static assets
  ]
}