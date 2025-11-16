import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// In-memory cache untuk domain mapping
// Cache akan reset saat server restart (by design untuk development)
const domainCache = new Map<string, { subdomain: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes cache

/**
 * Get subdomain from custom domain via API with caching
 */
async function getSubdomainFromDomain(hostname: string): Promise<string | null> {
  // 1. Check cache first
  const cached = domainCache.get(hostname)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Middleware] ✅ Cache HIT: ${hostname} -> ${cached.subdomain}`)
    return cached.subdomain
  }

  // 2. Cache miss - fetch from backend API
  try {
    console.log(`[Middleware] ⏳ Cache MISS: Fetching ${hostname} from API...`)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const url = `${apiUrl}/api/public/stores/by-domain/${hostname}`

    console.log(`[Middleware] 🔍 Calling: ${url}`)

    const response = await fetch(url, {
      cache: 'no-store', // Don't cache at fetch level, we handle caching ourselves
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      console.log(`[Middleware] ❌ No store found for domain: ${hostname} (${response.status})`)
      return null
    }

    const data = await response.json()

    if (data.success && data.data?.subdomain) {
      const subdomain = data.data.subdomain

      // Update cache
      domainCache.set(hostname, {
        subdomain,
        timestamp: Date.now()
      })

      console.log(`[Middleware] ✅ Cached: ${hostname} -> ${subdomain}`)
      return subdomain
    }

    console.log(`[Middleware] ⚠️  Invalid response for ${hostname}:`, data)
    return null
  } catch (error) {
    console.error(`[Middleware] 💥 Error fetching domain ${hostname}:`, error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  console.log(`[Middleware] 📥 Request: ${hostname}${url.pathname}`)

  // Skip internal/system domains
  if (
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('panel.aidareu.com') ||
    hostname.includes('api.aidareu.com')
  ) {
    console.log(`[Middleware] ⏭️  Skipping internal domain: ${hostname}`)
    return NextResponse.next()
  }

  // Handle subdomain.aidareu.com requests
  if (hostname.includes('.aidareu.com') && !hostname.startsWith('www.')) {
    const subdomain = hostname.split('.')[0]

    if (subdomain && subdomain !== 'www' && subdomain !== 'panel' && subdomain !== 'api') {
      console.log(`[Middleware] 🔄 Subdomain request: ${hostname} -> /s/${subdomain}`)
      url.pathname = `/s/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // Handle custom domain requests (aidareu.site, etc)
  if (!hostname.includes('aidareu.com') && !hostname.includes('localhost')) {
    const subdomain = await getSubdomainFromDomain(hostname)

    if (subdomain) {
      console.log(`[Middleware] 🌐 Custom domain: ${hostname} -> /s/${subdomain}`)
      url.pathname = `/s/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
      return NextResponse.rewrite(url)
    } else {
      console.log(`[Middleware] ⚠️  No mapping found for custom domain: ${hostname}`)
    }
  }

  console.log(`[Middleware] ✅ Pass through: ${hostname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api|images|icons).*)',
  ],
}
