import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  // Get URL info
  const { pathname } = request.nextUrl;
  
  // Handle direct access to /auth path to prevent redirect loops
  if (pathname === '/auth') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    // Preserve any query parameters
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    if (redirectTo) {
      redirectUrl.searchParams.set('redirectTo', redirectTo);
    }
    return NextResponse.redirect(redirectUrl);
  }
  
  // If we're using local DB in development, skip Supabase auth checks
  if (isLocalDb) {
    // Check if trying to access protected routes
    
    // For local development with auth routes, redirect to dashboard
    if (pathname.startsWith('/auth')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
    
    // In local dev mode, allow access to all routes
    return NextResponse.next();
  }
  
  // For Supabase mode, use normal auth flow
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is signed in and tries to access auth page, redirect to dashboard
  if (user && pathname.startsWith('/auth')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/events/create', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check role-based access for event creation
  if (user && pathname.startsWith('/events/create')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.role !== 'organizer') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
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