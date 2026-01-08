/**
 * Security Utilities
 * Fungsi-fungsi untuk meningkatkan keamanan frontend
 */

// Allowed domains untuk redirect
const ALLOWED_REDIRECT_DOMAINS = [
  'aidareu.com',
  'www.aidareu.com',
  'api.aidareu.com',
  'app.aidareu.com',
  'localhost',
  '127.0.0.1'
];

// Allowed paths untuk internal redirect
const ALLOWED_INTERNAL_PATHS = [
  '/dashboards',
  '/apps',
  '/auth',
  '/login',
  '/register',
  '/pages'
];

/**
 * Validate redirect URL untuk mencegah open redirect vulnerability
 * @param url - URL yang akan divalidasi
 * @param fallback - URL fallback jika tidak valid
 * @returns URL yang aman untuk redirect
 */
export function validateRedirectUrl(url: string | null | undefined, fallback: string = '/dashboards'): string {
  if (!url) return fallback;

  try {
    // Jika relative path, cek apakah path diizinkan
    if (url.startsWith('/')) {
      const isAllowed = ALLOWED_INTERNAL_PATHS.some(path => url.startsWith(path));
      return isAllowed ? url : fallback;
    }

    // Jika absolute URL, validasi domain
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    
    const isAllowedDomain = ALLOWED_REDIRECT_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowedDomain) {
      console.warn(`[Security] Blocked redirect to untrusted domain: ${hostname}`);
      return fallback;
    }

    return url;
  } catch {
    // URL tidak valid
    console.warn(`[Security] Invalid redirect URL: ${url}`);
    return fallback;
  }
}

/**
 * Safe redirect menggunakan Next.js router atau window.location
 * @param url - URL tujuan
 * @param router - Next.js router instance (optional)
 */
export function safeRedirect(url: string, router?: { replace: (url: string) => void }): void {
  const safeUrl = validateRedirectUrl(url);
  
  if (router) {
    router.replace(safeUrl);
  } else if (typeof window !== 'undefined') {
    window.location.href = safeUrl;
  }
}

/**
 * Sanitize string untuk mencegah XSS
 * Basic sanitization - untuk keamanan lebih baik gunakan DOMPurify
 * @param input - String yang akan disanitize
 * @returns String yang sudah disanitize
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object - sanitize semua string values dalam object
 * @param obj - Object yang akan disanitize
 * @returns Object dengan string values yang sudah disanitize
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Validate email format
 * @param email - Email yang akan divalidasi
 * @returns true jika email valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (Indonesia format)
 * @param phone - Nomor telepon yang akan divalidasi
 * @returns true jika nomor telepon valid
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Indonesia phone: 08xx, +628xx, 628xx
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Generate CSRF token (untuk client-side)
 * Note: Idealnya CSRF token di-generate di server
 * @returns Random CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check apakah external script sudah loaded dengan integrity
 * @param src - Script source URL
 * @param integrity - Expected integrity hash (SRI)
 * @returns Promise<boolean>
 */
export function loadScriptWithIntegrity(
  src: string, 
  integrity?: string,
  crossOrigin: string = 'anonymous'
): Promise<boolean> {
  return new Promise((resolve) => {
    // Check if script already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = crossOrigin;
    }

    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error(`[Security] Failed to load script: ${src}`);
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

/**
 * Rate limiter sederhana untuk client-side
 * Mencegah spam request dari frontend
 */
class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Filter timestamps dalam window
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }
}

// Export singleton instance
export const rateLimiter = new ClientRateLimiter();

// Export untuk custom rate limiter
export { ClientRateLimiter };
