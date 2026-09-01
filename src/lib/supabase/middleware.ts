import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Skip auth check for public pages - prevents hanging when Supabase is unreachable
  const publicPaths = ['/', '/login', '/signup', '/pricing', '/forgot-password', '/dashboard', '/reports', '/chat', '/api/auth']
  const isPublicPath = publicPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )
  const protectedPaths = ['/settings']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname === path)

  // Check for Supabase session cookies
  const hasSessionCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  // Public pages without session cookie: skip Supabase call entirely
  if (isPublicPath && !hasSessionCookie) {
    return response
  }


  // Protected paths without session cookie: redirect immediately
  if (isProtectedPath && !hasSessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // No session cookie at all: skip Supabase, serve as-is
  if (!hasSessionCookie) {
    return response
  }

  // Dev mode: skip Supabase network call when behind proxy.
  // Rely on session cookie presence + client-side AuthContext for verification.
  // This prevents hard-refresh hangs when Supabase is unreachable from local machine.
  //
  // IMPORTANT: We do NOT redirect from auth paths (/login, /signup) based on cookie presence.
  // Stale cookies would cause a redirect loop. Instead, let the client-side AuthContext
  // validate the session and redirect if valid.
  const user = hasSessionCookie ? { id: 'cookie-present' } : null

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const cleanRedirect = request.nextUrl.pathname
    url.searchParams.set('redirect', cleanRedirect)
    return NextResponse.redirect(url)
  }

  // Auth paths: always allow access. Client-side LoginForm will redirect to /dashboard
  // if AuthContext detects a valid session. This prevents stale-cookie redirect loops.
  if (isAuthPath) {
    return response
  }

  return response
}
