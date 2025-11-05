/**
 * Subdomain routing utilities
 * Handles URL generation for multi-tenant subdomain architecture
 */

/**
 * Check if running in development environment
 */
export const isDevelopment = (): boolean => {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname.includes('localhost') || hostname.includes('127.0.0.1')
}

/**
 * Get subdomain from current hostname
 * Example: serbaadaku.aidareu.com -> serbaadaku
 */
export const getSubdomain = (): string | null => {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname
  const hostParts = hostname.split('.')

  // In development, subdomain comes from URL path
  if (isDevelopment()) {
    const pathParts = window.location.pathname.split('/')
    if (pathParts[1] === 's' && pathParts[2]) {
      return pathParts[2]
    }
    return null
  }

  // In production, extract from hostname
  // serbaadaku.aidareu.com -> serbaadaku
  if (hostParts.length >= 3 && hostParts[0] !== 'www' && hostParts[0] !== 'app') {
    return hostParts[0]
  }

  return null
}

/**
 * Generate store URL for navigation
 * In development: /s/subdomain/path
 * In production: /path (subdomain is in hostname)
 */
export const getStoreUrl = (subdomain: string, path: string = ''): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (isDevelopment()) {
    // Development: use /s/subdomain/path
    return `/s/${subdomain}${normalizedPath}`
  }

  // Production: just /path (subdomain in hostname)
  return normalizedPath
}

/**
 * Navigate to store path
 * Handles both development and production routing
 */
export const navigateToStore = (subdomain: string, path: string = ''): string => {
  return getStoreUrl(subdomain, path)
}

/**
 * Get product detail URL
 */
export const getProductUrl = (subdomain: string, productSlug: string): string => {
  return getStoreUrl(subdomain, `/${productSlug}`)
}

/**
 * Get checkout URL
 */
export const getCheckoutUrl = (subdomain: string): string => {
  return getStoreUrl(subdomain, '/checkout')
}

/**
 * Get invoice URL
 */
export const getInvoiceUrl = (subdomain: string, uuid: string): string => {
  return getStoreUrl(subdomain, `/invoice/${uuid}`)
}

/**
 * Get store home URL
 */
export const getStoreHomeUrl = (subdomain: string): string => {
  return getStoreUrl(subdomain, '')
}
