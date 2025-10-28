import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Skip middleware for API routes, static files, and internal routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('/favicon')
  ) {
    return NextResponse.next()
  }

  // Log for debugging (shows in server logs, not browser)
  console.log('=== MIDDLEWARE DEBUG ===')
  console.log('Hostname:', hostname)
  console.log('Pathname:', pathname)

  // Extract subdomain from hostname
  // Example: tokobunga.aidareu.com -> tokobunga
  const subdomain = getSubdomain(hostname)
  console.log('Detected subdomain:', subdomain)

  // Handle subdomain routing
  if (subdomain && !isReservedSubdomain(subdomain)) {
    console.log('Subdomain is valid and not reserved')

    // If accessing subdomain, rewrite to /s/[subdomain] route
    // Example: tokobunga.aidareu.com/ -> aidareu.com/s/tokobunga
    // Example: tokobunga.aidareu.com/products -> aidareu.com/s/tokobunga/products

    const newUrl = request.nextUrl.clone()

    // Rewrite to /s/[subdomain] path
    if (pathname === '/' || !pathname.startsWith('/s/')) {
      const newPath = `/s/${subdomain}${pathname === '/' ? '' : pathname}`
      newUrl.pathname = newPath

      console.log('Rewriting to:', newPath)

      // Pass subdomain info via header for the page to use
      const response = NextResponse.rewrite(newUrl)
      response.headers.set('x-subdomain', subdomain)
      response.headers.set('x-hostname', hostname)

      return response
    }
  } else {
    console.log('No subdomain detected or subdomain is reserved')
  }

  // Handle custom domain routing
  if (isCustomDomain(hostname)) {
    // Check if this is a custom domain mapped to a store
    // We'll fetch store by domain from backend
    const newUrl = request.nextUrl.clone()
    newUrl.pathname = `/d/${hostname}${pathname === '/' ? '' : pathname}`

    const response = NextResponse.rewrite(newUrl)
    response.headers.set('x-custom-domain', hostname)

    return response
  }

  // Only proxy requests that start with /api/proxy/ to the Laravel backend
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

  return NextResponse.next()
}

// Helper function to extract subdomain
function getSubdomain(hostname: string): string | null {
  // Remove port if exists
  const host = hostname.split(':')[0]

  // Split by dots
  const parts = host.split('.')

  // For localhost or IP, no subdomain
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return null
  }

  // For aidareu.com -> no subdomain
  // For tokobunga.aidareu.com -> tokobunga
  // For www.aidareu.com -> www (but we'll treat this as no subdomain)
  if (parts.length >= 3) {
    const subdomain = parts[0]

    // Ignore www
    if (subdomain === 'www') {
      return null
    }

    return subdomain
  }

  return null
}

// Reserved subdomains that should not be treated as store subdomains
function isReservedSubdomain(subdomain: string): boolean {
  const reserved = [
    'www',
    'api',
    'admin',
    'dashboard',
    'app',
    'mail',
    'smtp',
    'ftp',
    'webmail',
    'cpanel',
    'staging',
    'dev',
    'test'
  ]

  return reserved.includes(subdomain.toLowerCase())
}

// Check if hostname is a custom domain (not aidareu.com subdomain)
function isCustomDomain(hostname: string): boolean {
  const host = hostname.split(':')[0]

  // If it's aidareu.com or *.aidareu.com, it's not custom domain
  if (host.endsWith('.aidareu.com') || host === 'aidareu.com') {
    return false
  }

  // If localhost or IP, not custom domain
  if (host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return false
  }

  // Otherwise, it's a custom domain
  return true
}

export const config = {
  // Match all requests except Next.js internals and static files
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
