import { getRunnerProfile, createRunnerProfile, updateRunnerProfile } from '@/lib/actions/profile';
import { createServerClient } from '@supabase/ssr';

// Mock the createServerClient function from Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}));

// Mock the cookies function from Next.js
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    get: jest.fn().mockImplementation((name) => ({ value: `mock-cookie-${name}` })),
    set: jest.fn(),
    remove: jest.fn()
  })
}));

// Mock the redirect function from Next.js
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}));

// Mock the revalidatePath function from Next.js
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

// Helper function to create chainable query methods
function createChainable(returnValue = {}) {
  const chainable: any = {};
  ['select', 'eq', 'insert', 'update', 'from'].forEach(method => {
    chainable[method] = jest.fn(() => chainable);
  });
  // Make single and count return a promise
  chainable.single = jest.fn(() => Promise.resolve(returnValue));
  return chainable;
}

describe('Profile Actions', () => {
  // Mock user data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'runner'
  };

  // Mock runner profile data
  const mockRunnerProfile = {
    id: 'user-123',
    address: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    postal_code: '12345',
    country: 'Test Country',
    phone: '+1-555-123-4567',
    date_of_birth: new Date('1990-01-01').toISOString(),
    gender: 'prefer_not_to_say',
    experience_level: 'intermediate',
    t_shirt_size: 'L',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let mockQueryBuilder;
  let mockSupabaseClient;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Save original environment variables
    originalEnv = process.env;
    
    // Set required environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-key',
      IS_LOCAL_DB: 'false'
    };
    
    // Setup mock query builder
    mockQueryBuilder = createChainable();
    
    // Setup mock client with auth
    mockSupabaseClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: 'user-123' } } },
          error: null
        })
      },
      from: jest.fn().mockReturnValue(mockQueryBuilder)
    };
    
    // Set createServerClient to return our mock
    (createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('getRunnerProfile', () => {
    test('returns mock profile when IS_LOCAL_DB is true', async () => {
      process.env.IS_LOCAL_DB = 'true';
      
      const profile = await getRunnerProfile();
      
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('mock-user-id');
      expect(profile?.city).toBe('Test City');
      
      // Verify that Supabase client was not called
      expect(createServerClient).not.toHaveBeenCalled();
    });

    test('redirects to auth when session is null', async () => {
      // Mock no session
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null
      });
      
      await getRunnerProfile();
      
      // Check that redirect was called with the auth page
      expect(require('next/navigation').redirect).toHaveBeenCalledWith('/auth');
    });

    test('returns profile from database', async () => {
      // Mock user role query
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: { role: 'runner' }, 
        error: null 
      });
      
      // Mock profile query
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: mockRunnerProfile, 
        error: null 
      });
      
      const profile = await getRunnerProfile();
      
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('user-123');
      expect(profile?.city).toBe('Test City');
      
      // Verify queries
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('runner_profiles');
    });

    test('returns null when user is not a runner', async () => {
      // Mock user role query to return non-runner role
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: { role: 'organizer' }, 
        error: null 
      });
      
      const profile = await getRunnerProfile();
      
      expect(profile).toBeNull();
    });

    test('returns null when profile not found', async () => {
      // Mock user role query
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: { role: 'runner' }, 
        error: null 
      });
      
      // Mock profile query with PGRST116 error (not found)
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });
      
      const profile = await getRunnerProfile();
      
      expect(profile).toBeNull();
    });
  });

  describe('createRunnerProfile', () => {
    const newProfileData = {
      address: '456 New St',
      city: 'New City',
      state: 'New State'
    };

    test('returns mock profile with new data when IS_LOCAL_DB is true', async () => {
      process.env.IS_LOCAL_DB = 'true';
      
      const profile = await createRunnerProfile(newProfileData);
      
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('mock-user-id');
      expect(profile?.address).toBe('456 New St');
      expect(profile?.city).toBe('New City');
      
      // Verify that Supabase client was not called
      expect(createServerClient).not.toHaveBeenCalled();
    });

    test('creates profile in database', async () => {
      // Mock user role query
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: { role: 'runner' }, 
        error: null 
      });
      
      // Mock insert query
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: { ...mockRunnerProfile, ...newProfileData }, 
        error: null 
      });
      
      const profile = await createRunnerProfile(newProfileData);
      
      expect(profile).not.toBeNull();
      expect(profile?.address).toBe('456 New St');
      
      // Verify queries
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('runner_profiles');
      expect(mockQueryBuilder.insert).toHaveBeenCalled();
      expect(require('next/cache').revalidatePath).toHaveBeenCalledWith('/dashboard/profile');
    });
  });

  describe('updateRunnerProfile', () => {
    const updateData = {
      city: 'Updated City',
      state: 'Updated State'
    };

    test('returns mock profile with updated data when IS_LOCAL_DB is true', async () => {
      process.env.IS_LOCAL_DB = 'true';
      
      const profile = await updateRunnerProfile(updateData);
      
      expect(profile).not.toBeNull();
      expect(profile?.id).toBe('mock-user-id');
      expect(profile?.city).toBe('Updated City');
      
      // Verify that Supabase client was not called
      expect(createServerClient).not.toHaveBeenCalled();
    });

    test('updates profile in database', async () => {
      // Mock update query
      mockQueryBuilder.single.mockResolvedValueOnce({ 
        data: { ...mockRunnerProfile, ...updateData }, 
        error: null 
      });
      
      const profile = await updateRunnerProfile(updateData);
      
      expect(profile).not.toBeNull();
      expect(profile?.city).toBe('Updated City');
      
      // Verify queries
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('runner_profiles');
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(require('next/cache').revalidatePath).toHaveBeenCalledWith('/dashboard/profile');
    });
  });
}); 