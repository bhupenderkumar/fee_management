'use client'

import { useState } from 'react'
import { LogOut, Shield } from 'lucide-react'
import { logout } from '@/lib/auth'

interface LogoutButtonProps {
  className?: string
  variant?: 'button' | 'menu-item'
}

export default function LogoutButton({ className = '', variant = 'button' }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    const confirmed = window.confirm('Are you sure you want to logout?')
    if (!confirmed) return

    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoggingOut(false)
    }
  }

  if (variant === 'menu-item') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoggingOut ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
            <span>Logging out...</span>
          </>
        ) : (
          <>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`inline-flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${className}`}
      title="Logout"
    >
      {isLoggingOut ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="hidden sm:inline">Logging out...</span>
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </>
      )}
    </button>
  )
}

// Security indicator component to show authentication status
export function SecurityIndicator() {
  return (
    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
      <Shield className="w-3 h-3" />
      <span>Secure Session</span>
    </div>
  )
}
