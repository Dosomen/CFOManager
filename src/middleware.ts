import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = new Set<string>([
  '/login',
  '/passwort-vergessen',
  '/passwort-zuruecksetzen',
])

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.has(pathname)
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  if (isPublicRoute(pathname)) {
    if (user && pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    if (pathname !== '/') {
      url.searchParams.set('next', pathname + search)
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
