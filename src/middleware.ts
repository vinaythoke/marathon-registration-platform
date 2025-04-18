import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  // If we're using local DB in development, skip Supabase auth checks
  if (isLocalDb) {
    // Check if trying to access protected routes
    const { pathname } = request.nextUrl;
    
    // For local development with auth routes, redirect to dashboard
    if (pathname.startsWith('/auth')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    
    // In local dev mode, allow access to all routes
    return res;
  }
  
  // For Supabase mode, use normal auth flow
  try {
    const supabase = createMiddlewareClient({ req: request, res });

    // Refresh session if expired - required for Server Components
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get URL info
    const { pathname } = request.nextUrl;

    // If user is signed in and tries to access auth page, redirect to dashboard
    if (session && pathname.startsWith('/auth')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/events/create', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (!session && isProtectedRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check role-based access for event creation
    if (session && pathname.startsWith('/events/create')) {
      const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (!user || user.role !== 'organizer') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return NextResponse.redirect(redirectUrl);
      }
    }
  } catch (error) {
    console.error('Middleware error:', error);
  }

  return res;
}

// Configure matcher to run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public API routes
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}; 