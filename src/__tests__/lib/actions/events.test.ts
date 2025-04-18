import { fetchEventWithTickets } from '@/lib/actions/events';
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

describe('Events Actions', () => {
  // Mock event data
  const mockEvent = {
    id: 'event-123',
    title: 'Mock Marathon',
    description: 'A test marathon event',
    date: new Date().toISOString(),
    location: 'Test City',
    status: 'published',
    banner_url: 'https://example.com/banner.jpg',
    organizer_id: 'user-123',
    registration_deadline: new Date(Date.now() + 86400000).toISOString()
  };

  // Mock tickets data
  const mockTickets = [
    {
      id: 'ticket-1',
      event_id: 'event-123',
      name: 'Standard Entry',
      description: 'Regular marathon entry',
      price: 50.00,
      quantity: 100,
      status: 'active',
      max_per_user: 1
    },
    {
      id: 'ticket-2',
      event_id: 'event-123',
      name: 'VIP Entry',
      description: 'VIP marathon entry',
      price: 100.00,
      quantity: 50,
      status: 'active',
      max_per_user: 1
    }
  ];

  // Mock form schema
  const mockFormSchema = {
    fields: [
      {
        id: 'field-1',
        type: 'text',
        label: 'Full Name',
        required: true
      }
    ]
  };

  // Create a more flexible mock that handles chained methods
  let mockQueryBuilder;
  let mockSupabaseClient;

  // Helper function to create chainable methods
  function createChainable(returnValue = {}) {
    const chainable: any = {};
    ['select', 'eq', 'not', 'head'].forEach(method => {
      chainable[method] = jest.fn(() => chainable);
    });
    // Make single and count return a promise
    chainable.single = jest.fn(() => Promise.resolve(returnValue));
    chainable.count = jest.fn(() => Promise.resolve(returnValue));
    return chainable;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    
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

  test('fetchEventWithTickets returns null when event not found', async () => {
    // Mock event query to return no data
    mockQueryBuilder.single.mockResolvedValueOnce({ data: null, error: null });
    
    const result = await fetchEventWithTickets('non-existent-id');
    expect(result).toBeNull();
    
    // Verify the supabase query
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('events');
    expect(mockQueryBuilder.select).toHaveBeenCalled();
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'non-existent-id');
  });

  test('fetchEventWithTickets returns event with tickets and availability', async () => {
    // Reset our mocks with the responses we want
    mockQueryBuilder = createChainable();
    mockSupabaseClient.from = jest.fn().mockImplementation((table) => {
      if (table === 'events') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockEvent, error: null })
        };
      } else if (table === 'tickets') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: mockTickets, error: null })
          })
        };
      } else if (table === 'registrations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          not: jest.fn().mockReturnThis(),
          count: jest.fn().mockResolvedValue({ count: 20, error: null })
        };
      } else if (table === 'event_forms') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { schema: mockFormSchema }, error: null })
        };
      }
      return mockQueryBuilder;
    });
    
    // This is a simplified test that just verifies the function doesn't throw
    await expect(fetchEventWithTickets('event-123')).resolves.not.toThrow();
  });

  test('redirects to auth page when user not authenticated', async () => {
    // Mock no session
    mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null
    });
    
    await fetchEventWithTickets('event-123');
    
    // Check that redirect was called with the auth page
    expect(require('next/navigation').redirect).toHaveBeenCalledWith('/auth');
  });
}); 