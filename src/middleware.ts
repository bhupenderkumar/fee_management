import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/verify']
  
  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // For protected paths, check if user has auth token in session storage
  // Since middleware runs on server-side, we can't access sessionStorage directly
  // We'll let the client-side AuthWrapper handle the redirect
  
  // However, we can check for API routes and other server-side routes
  if (pathname.startsWith('/api/')) {
    // Allow API routes to handle their own authentication
    return NextResponse.next()
  }

  // For all other routes, let the AuthWrapper handle authentication
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
