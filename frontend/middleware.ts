/**
 * Middleware for Auth Route Protection
 *
 * This middleware runs on every request and handles:
 * 1. Session validation using JWT from cookies
 * 2. Protecting dashboard routes (requires authentication)
 * 3. Redirecting authenticated users away from auth pages
 *
 * Note: Updated to work with microservices architecture
 */

import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check for auth token in cookies
  const authToken = request.cookies.get('auth_token')?.value
  const hasAuth = !!authToken

  // Protected routes that require authentication
  const isProtectedRoute = pathname.startsWith('/dashboard') ||
                           pathname.startsWith('/todos') ||
                           pathname.startsWith('/fundflow') ||
                           pathname.startsWith('/settings')

  // Auth routes that should redirect if already logged in
  const isAuthRoute = pathname.startsWith('/login') ||
                      pathname.startsWith('/signup') ||
                      pathname.startsWith('/reset-password')

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !hasAuth) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isAuthRoute && hasAuth) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
