import { middleware } from '@/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, NextRequest } from 'next/server';

// Mock the NextResponse and NextRequest
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn().mockReturnValue({
        cookies: {
          set: jest.fn(),
          getAll: jest.fn().mockReturnValue([]),
        },
      }),
      redirect: jest.fn().mockImplementation((url) => ({
        url,
        cookies: {
          set: jest.fn(),
          getAll: jest.fn().mockReturnValue([]),
        },
      })),
    },
  };
});

// Mock the Supabase client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { role: 'runner' } }),
  }),
}));

describe('Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.IS_LOCAL_DB = 'false';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
  });

  const createMockRequest = (path: string, searchParams = {}) => {
    const url = new URL(`https://example.com${path}`);
    
    // Add search params
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value as string);
    });
    
    return {
      nextUrl: url,
      url: url.toString(),
      cookies: {
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
      },
      headers: {
        get: jest.fn(),
      },
      clone: jest.fn().mockReturnThis(),
    } as unknown as NextRequest;
  };

  test('redirects /auth to /auth/login', async () => {
    const mockRequest = createMockRequest('/auth');
    await middleware(mockRequest);

    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/auth/login',
      })
    );
  });

  test('skips auth checks in local DB mode', async () => {
    process.env.IS_LOCAL_DB = 'true';
    const mockRequest = createMockRequest('/dashboard');
    
    await middleware(mockRequest);
    
    // Verify that no redirect happened and we just proceeded with next()
    expect(NextResponse.next).toHaveBeenCalled();
    expect(createServerClient).not.toHaveBeenCalled();
  });

  test('redirects from auth to dashboard when user is signed in', async () => {
    const mockUser = { id: 'user-123' };
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
    });
    
    const mockRequest = createMockRequest('/auth/login');
    await middleware(mockRequest);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/dashboard',
      })
    );
  });

  test('redirects from protected routes to login when user is not signed in', async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    
    const mockRequest = createMockRequest('/dashboard');
    await middleware(mockRequest);
    
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/auth/login',
      })
    );
  });

  test('preserves redirectTo parameter when redirecting to login', async () => {
    (createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    
    const mockRequest = createMockRequest('/dashboard');
    await middleware(mockRequest);
    
    // Check that redirectTo was set to the original path
    const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectCall.searchParams.get('redirectTo')).toBe('/dashboard');
  });

  test('blocks non-organizer users from event creation', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'runner' } }),
    };
    
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
    
    const mockRequest = createMockRequest('/events/create');
    await middleware(mockRequest);
    
    // Check that non-organizer was redirected to dashboard
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/dashboard',
      })
    );
  });

  test('allows organizer users to access event creation', async () => {
    const mockUser = { id: 'user-123' };
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { role: 'organizer' } }),
    };
    
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
    
    const mockRequest = createMockRequest('/events/create');
    const mockResponse = { cookies: { set: jest.fn() } };
    NextResponse.next = jest.fn().mockReturnValue(mockResponse);
    
    const result = await middleware(mockRequest);
    
    // Check that organizer was allowed through
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(result).toBe(mockResponse);
  });
}); 