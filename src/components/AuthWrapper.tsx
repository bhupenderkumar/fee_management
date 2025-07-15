'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, requiresAuth, clearAuth } from '@/lib/auth'
import { School, Lock } from 'lucide-react'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      const needsAuth = requiresAuth(pathname)

      setIsAuthed(authenticated)

      if (needsAuth && !authenticated) {
        // Clear any stale auth data
        clearAuth()
        // Redirect to login with current path as return URL
        const returnUrl = pathname !== '/' ? `?returnUrl=${encodeURIComponent(pathname)}` : ''
        router.replace(`/login${returnUrl}`)
      } else if (!needsAuth && authenticated && pathname === '/login') {
        // User is authenticated but on login page, redirect to dashboard or return URL
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl') || '/dashboard/dashboard'
        router.replace(returnUrl)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [pathname, router])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">First Step School</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied for unauthenticated users on protected routes
  if (requiresAuth(pathname) && !isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be authenticated to access this page.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all duration-200 shadow-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Render children for authenticated users or public pages
  return <>{children}</>
}
