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

  try {
    // Use getUser instead of getSession for better security
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;

    // If user is signed in and tries to access auth page, redirect to dashboard
    if (user && pathname.startsWith('/auth')) {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo');
      const role = request.nextUrl.searchParams.get('role');
      
      // If we have a redirectTo parameter, use that
      if (redirectTo) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = redirectTo;
        return NextResponse.redirect(redirectUrl);
      }
      
      // Otherwise redirect to dashboard
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
      // Preserve the role parameter if it exists
      const role = request.nextUrl.searchParams.get('role');
      if (role) {
        redirectUrl.searchParams.set('role', role);
      }
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Special handling for profile page - allow access regardless of role
    if (pathname === '/dashboard/profile') {
      return supabaseResponse;
    }

    // If accessing root dashboard, get user role and redirect accordingly
    if (user && pathname === '/dashboard') {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();

      if (!userData) {
        // If no user data exists, redirect to profile creation
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard/profile';
        return NextResponse.redirect(redirectUrl);
      }

      // Redirect to role-specific dashboard
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/dashboard/${userData.role}`;
      return NextResponse.redirect(redirectUrl);
    }

    // Check role-based access for specific dashboards
    if (user && pathname.startsWith('/dashboard/')) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();

      const requestedRole = pathname.split('/')[2]; // Get role from URL

      // If no user data exists, redirect to profile creation
      if (!userData) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/dashboard/profile';
        return NextResponse.redirect(redirectUrl);
      }

      // If trying to access wrong role's dashboard, redirect to their correct dashboard
      if (userData.role !== requestedRole && requestedRole !== 'profile') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/dashboard/${userData.role}`;
        return NextResponse.redirect(redirectUrl);
      }
    }

    return supabaseResponse;
  } catch (error) {
    // If there's an auth error, redirect to login
    if (pathname.startsWith('/dashboard')) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 