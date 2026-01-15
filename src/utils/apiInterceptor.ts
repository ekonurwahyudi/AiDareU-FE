// Centralized API fetch wrapper with automatic 401 handling
// Handles session expiration and redirects to login when unauthorized

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authToken = localStorage.getItem('auth_token')

  // Add auth headers
  const headers = new Headers(options.headers)

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })

  // Handle 401 Unauthorized - Session expired
  if (response.status === 401) {
    handleUnauthorized()
    throw new Error('Session expired')
  }

  return response
}

function handleUnauthorized() {
  // Clear all auth data
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_data')
  localStorage.removeItem('unverified_user')
  localStorage.removeItem('last_activity')

  // Get current path for redirect after login
  const currentPath = window.location.pathname

  // Don't redirect if already on login/home page
  if (currentPath !== '/login' && currentPath !== '/') {
    // Redirect to login with expired flag and return url
    window.location.href = `/login?expired=true&redirect=${encodeURIComponent(currentPath)}`
  } else if (currentPath === '/') {
    // Just reload home page
    window.location.href = '/'
  }
}

// Helper function to check if error is session expiry
export function isSessionExpired(error: any): boolean {
  return error?.message === 'Session expired' || error?.response?.status === 401
}
