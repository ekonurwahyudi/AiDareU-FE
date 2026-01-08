'use client'

// React Imports
import { useEffect, useState } from 'react'

// Type Imports
import type { ChildrenType } from '@core/types'

// Component Imports
import AuthRedirect from '@/components/AuthRedirect'

/**
 * Validate token format (basic validation)
 * Token harus berupa string non-empty dengan panjang minimal
 */
function isValidToken(token: string | null): boolean {
  if (!token || typeof token !== 'string') return false;
  // Token minimal 20 karakter (typical JWT/Bearer token)
  return token.length >= 20;
}

/**
 * Validate user data structure
 */
function isValidUserData(userData: string | null): boolean {
  if (!userData) return false;
  try {
    const parsed = JSON.parse(userData);
    // Minimal harus ada id dan email
    return !!(parsed && (parsed.id || parsed.uuid) && parsed.email);
  } catch {
    return false;
  }
}

export default function AuthGuard({ children }: ChildrenType) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check for auth token in localStorage with validation
    const authToken = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    const hasValidToken = isValidToken(authToken)
    const hasValidUserData = isValidUserData(userData)
    
    console.log('AuthGuard: Checking auth status', { 
      hasToken: !!authToken, 
      hasUserData: !!userData,
      isValidToken: hasValidToken,
      isValidUserData: hasValidUserData
    })
    
    // Jika token atau user data tidak valid, clear storage
    if ((authToken && !hasValidToken) || (userData && !hasValidUserData)) {
      console.warn('AuthGuard: Invalid auth data detected, clearing storage')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      setIsAuthenticated(false)
      return
    }
    
    setIsAuthenticated(hasValidToken && hasValidUserData)
  }, [])

  // Show loading while checking auth status
  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    )
  }

  return <>{isAuthenticated ? children : <AuthRedirect />}</>
}
