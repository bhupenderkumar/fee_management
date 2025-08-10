'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, School, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [key, setKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  // Load saved credentials on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('saved_access_key')
      const savedRememberMe = localStorage.getItem('remember_me') === 'true'
      if (savedKey && savedRememberMe) {
        setKey(savedKey)
        setRememberMe(true)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store authentication state in session storage
        sessionStorage.setItem('auth_token', data.token)
        sessionStorage.setItem('auth_timestamp', Date.now().toString())

        // Handle remember me functionality
        if (rememberMe) {
          localStorage.setItem('saved_access_key', key)
          localStorage.setItem('remember_me', 'true')
        } else {
          localStorage.removeItem('saved_access_key')
          localStorage.removeItem('remember_me')
        }

        // Redirect to return URL or main dashboard
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl') || '/dashboard/dashboard'
        router.push(returnUrl)
      } else {
        setError(data.error || 'Invalid access key')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* School Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-4 shadow-lg">
            <School className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">First Step School</h1>
          <p className="text-gray-600">Management System Access</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-3">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Secure Access</h2>
            <p className="text-sm text-gray-600 mt-1">Enter your access key to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-2">
                Access Key
              </label>
              <div className="relative">
                <input
                  id="key"
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder="Enter your access key"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember my access key
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !key.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Access System'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Authorized personnel only. All access is logged and monitored.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 First Step School. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
