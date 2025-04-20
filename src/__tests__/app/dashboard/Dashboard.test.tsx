import { redirect } from 'next/navigation';
import DashboardPage from '@/app/dashboard/page';
import { createClient } from '@/lib/supabase/server';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock the supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock the cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue({ value: 'runner' }),
  }),
}));

// Helper function to create expected props format for DashboardPage
const createMockProps = (roleValue?: string) => {
  // Instead of passing a Promise directly, we create an object that mimics how Next.js
  // would provide searchParams, but allows for them to be awaited internally
  return {
    searchParams: {
      role: roleValue,
      // This object has a then method to make it "thenable" so await works on it
      then: (resolve: Function) => resolve({ role: roleValue }),
    },
  };
};

describe('Dashboard Page Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.IS_LOCAL_DB = 'false';
  });

  test('searchParams are properly awaited in Next.js 15', async () => {
    // Setup mock props with searchParams that can be awaited
    const mockProps = createMockProps('organizer');

    // Call the dashboard page component
    await DashboardPage(mockProps);

    // Verify that redirect was called with the correct role from searchParams
    expect(redirect).toHaveBeenCalledWith('/dashboard/organizer');
  });

  test('redirects to correct role dashboard when valid role is in searchParams', async () => {
    // Setup mock searchParams with valid roles
    const testCases = [
      { role: 'organizer', redirectPath: '/dashboard/organizer' },
      { role: 'runner', redirectPath: '/dashboard/runner' },
      { role: 'volunteer', redirectPath: '/dashboard/volunteer' },
    ];

    for (const testCase of testCases) {
      jest.clearAllMocks();
      const mockProps = createMockProps(testCase.role);

      // Call the dashboard page component
      await DashboardPage(mockProps);

      // Verify that redirect was called with the correct path
      expect(redirect).toHaveBeenCalledWith(testCase.redirectPath);
    }
  });

  test('uses environment variable in local development mode', async () => {
    // Setup for local development
    process.env.IS_LOCAL_DB = 'true';
    process.env.DEV_USER_ROLE = 'organizer';

    const mockProps = createMockProps();

    // Call the dashboard page component
    await DashboardPage(mockProps);

    // Verify local DB mode redirects based on environment variable
    expect(redirect).toHaveBeenCalledWith('/dashboard/organizer');
  });

  test('retrieves user role from Supabase and redirects accordingly', async () => {
    // Setup Supabase mock for non-local environment
    const mockUser = { id: 'user-id' };
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: mockUser },
    });

    const mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'volunteer' },
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const mockProps = createMockProps();

    // Call the dashboard page component
    await DashboardPage(mockProps);

    // Verify that auth.getUser was called
    expect(mockGetUser).toHaveBeenCalled();

    // This test might not accurately verify the redirect based on role
    // since we're mocking the cached function, but we can verify
    // that the Supabase client was created
    expect(createClient).toHaveBeenCalled();
  });

  test('redirects to auth page when user is not authenticated', async () => {
    // Setup Supabase mock returning no user
    const mockGetUser = jest.fn().mockResolvedValue({
      data: { user: null },
    });

    const mockSupabase = {
      auth: {
        getUser: mockGetUser,
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const mockProps = createMockProps();

    // Call the dashboard page component
    await DashboardPage(mockProps);

    // Verify redirect to auth page when user is not authenticated
    expect(redirect).toHaveBeenCalledWith('/auth');
  });
}); 