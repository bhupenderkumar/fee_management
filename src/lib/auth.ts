// Authentication utilities for client-side auth management

export interface AuthState {
  isAuthenticated: boolean
  token: string | null
  timestamp: number | null
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  const token = sessionStorage.getItem('auth_token')
  const timestamp = sessionStorage.getItem('auth_timestamp')
  
  if (!token || !timestamp) return false
  
  // Check if token is expired (24 hours)
  const tokenAge = Date.now() - parseInt(timestamp)
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  
  if (tokenAge > maxAge) {
    // Token expired, clear storage
    clearAuth()
    return false
  }
  
  return true
}

// Get current auth state
export function getAuthState(): AuthState {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, token: null, timestamp: null }
  }
  
  const token = sessionStorage.getItem('auth_token')
  const timestamp = sessionStorage.getItem('auth_timestamp')
  
  return {
    isAuthenticated: isAuthenticated(),
    token,
    timestamp: timestamp ? parseInt(timestamp) : null
  }
}

// Clear authentication data
export function clearAuth(): void {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_timestamp')
  // Note: We don't clear localStorage here to preserve "Remember Me" functionality
}

// Clear saved credentials (for "Remember Me" functionality)
export function clearSavedCredentials(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem('saved_access_key')
  localStorage.removeItem('remember_me')
}

// Logout function
export async function logout(): Promise<void> {
  try {
    // Call logout API
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Logout API error:', error)
  } finally {
    // Always clear local auth data
    clearAuth()
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }
}

// Verify token with server
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })
    
    const data = await response.json()
    return data.valid === true
  } catch (error) {
    console.error('Token verification error:', error)
    return false
  }
}

// Get auth token for API requests
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('auth_token')
}

// Check if current page requires authentication
export function requiresAuth(pathname: string): boolean {
  // Pages that don't require authentication
  const publicPaths = ['/login']

  // Check if pathname starts with any public path
  return !publicPaths.some(path => pathname.startsWith(path))
}
