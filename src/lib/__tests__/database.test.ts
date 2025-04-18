import { createClient, SupabaseClient, PostgrestResponse, PostgrestSingleResponse, RealtimeChannel } from '@supabase/supabase-js';
import { testSupabaseConnection } from '../test-connection';
import { Database, Profile, Event, Registration } from '../database.types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;
type Row<T extends TableName> = Tables[T]['Row'];
type Insert<T extends TableName> = Tables[T]['Insert'];
type Update<T extends TableName> = Tables[T]['Update'];

// Define types locally since we can't import database.types
interface Profile {
  id: string;
  created_at: string;
  email: string;
  name: string;
}

interface Event {
  id: string;
  created_at: string;
  title: string;
  date: string;
  status: string;
}

interface Registration {
  id: string;
  created_at: string;
  event_id: string;
  user_id: string;
  status: string;
}

interface QueryResponse<T> {
  data: T | null;
  error: Error | null;
}

// Mock database structure
interface MockDatabase {
  profiles: Row<'profiles'>[];
  events: Row<'events'>[];
  registrations: Row<'registrations'>[];
  tickets: Row<'tickets'>[];
}

// Mock data types
interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'runner' | 'organizer' | 'volunteer';
}

interface Event {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'published' | 'cancelled';
  organizer_id: string;
}

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

interface Ticket {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  max_per_user: number;
  status: 'active' | 'inactive';
}

// Mock database instance
const mockDatabase: MockDatabase = {
  profiles: [],
  events: [],
  registrations: [],
  tickets: []
};

// Generic mock query builder
class MockQueryBuilder<T extends TableName> {
  private table: T;
  private filters: Array<(row: Row<T>) => boolean> = [];
  private mockData: Row<T>[] = [];

  constructor(table: T, mockData: Row<T>[] = []) {
    this.table = table;
    this.mockData = mockData;
  }

  eq(column: keyof Row<T>, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  select() {
    return this;
  }

  single() {
    const filtered = this.mockData.filter((row) => 
      this.filters.every((filter) => filter(row))
    );
    return Promise.resolve({ data: filtered[0] || null, error: null });
  }

  insert(data: Insert<T>) {
    const newRow = {
      id: Math.random().toString(),
      created_at: new Date().toISOString(),
      ...data,
    } as Row<T>;
    this.mockData.push(newRow);
    return Promise.resolve({ data: newRow, error: null });
  }

  update(data: Update<T>) {
    const filtered = this.mockData.filter((row) => 
      this.filters.every((filter) => filter(row))
    );
    if (filtered.length > 0) {
      Object.assign(filtered[0], data);
      return Promise.resolve({ data: filtered[0], error: null });
    }
    return Promise.resolve({ data: null, error: new Error('Not found') });
  }
}

// Mock Supabase client
const mockSupabaseClient = {
  from: <T extends TableName>(table: T) => new MockQueryBuilder<T>(table),
  channel: (channel: string) => ({
    on: (event: string, callback: Function) => ({
      subscribe: () => Promise.resolve(),
    }),
  }),
} as unknown as SupabaseClient;

// Mock initial data
const mockOrganizerData: Profile = {
  id: 'test-organizer-id',
  email: 'organizer@test.com',
  name: 'Organizer',
  created_at: new Date().toISOString()
};

const mockRunnerData: Profile = {
  id: 'test-runner-id',
  email: 'runner@test.com',
  name: 'Runner',
  created_at: new Date().toISOString()
};

const mockVolunteerData: Profile = {
  id: 'test-volunteer-id',
  email: 'volunteer@test.com',
  name: 'Volunteer',
  created_at: new Date().toISOString()
};

// Clear mock database before each test
beforeEach(() => {
  mockDatabase.profiles = [];
  mockDatabase.events = [];
  mockDatabase.registrations = [];
  mockDatabase.tickets = [];
});

// Mock the createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient
}));

describe('Database Operations', () => {
  let mockDb: {
    profiles: Row<'profiles'>[];
    events: Row<'events'>[];
    registrations: Row<'registrations'>[];
    tickets: Row<'tickets'>[];
  };

  beforeEach(() => {
    mockDb = {
      profiles: [],
      events: [],
      registrations: [],
      tickets: [],
    };
  });

  describe('Connection', () => {
    it('successfully connects to Supabase', async () => {
      const result = await testSupabaseConnection();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Successfully connected to Supabase');
    }, 5000);
  });

  describe('User Operations', () => {
    it('should create a new user profile', async () => {
      const mockUser = {
        id: 'test-user-1',
        email: 'test@example.com',
        name: 'Test User'
      };

      const { data, error } = await anonClient
        .from('profiles')
        .insert([mockUser])
        .select('*')
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject(mockUser);
      expect(mockDatabase.profiles).toHaveLength(1);
      expect(mockDatabase.profiles[0]).toMatchObject(mockUser);
    }, 5000);

    it('should update an existing user profile', async () => {
      const updatedName = 'Updated Test User';
      const { data, error } = await anonClient
        .from('profiles')
        .update({ name: updatedName })
        .eq('id', 'test-user-1')
        .select('*')
        .single();

      expect(error).toBeNull();
      expect(data.name).toBe(updatedName);
      expect(mockDatabase.profiles[0].name).toBe(updatedName);
    }, 5000);

    it('should delete a user profile', async () => {
      const { error } = await anonClient
        .from('profiles')
        .delete()
        .eq('id', 'test-user-1');

      expect(error).toBeNull();
      expect(mockDatabase.profiles).toHaveLength(0);
    }, 5000);
  });

  describe('Event Operations', () => {
    let eventId: string;

    it('organizer can create event', async () => {
      const mockEvent = {
        id: 'test-event-id',
        title: 'Test Marathon',
        date: new Date().toISOString(),
        status: 'draft',
        organizer_id: mockOrganizerData.id
      };

      const { data, error } = await anonClient
        .from('events')
        .insert(mockEvent)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        title: 'Test Marathon',
        status: 'draft'
      });

      eventId = data.id;
    }, 5000);

    it('runner cannot create event (RLS)', async () => {
      const { error } = await anonClient
        .from('events')
        .insert({
          id: 'unauthorized-event-id',
          title: 'Unauthorized Event',
          date: new Date().toISOString(),
          status: 'draft',
          organizer_id: mockRunnerData.id
        });

      expect(error).not.toBeNull();
    }, 5000);

    it('organizer can update their event', async () => {
      const updatedTitle = 'Updated Marathon';
      const { data, error } = await anonClient
        .from('events')
        .update({ title: updatedTitle })
        .eq('id', eventId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.title).toBe(updatedTitle);
    }, 5000);

    it('runner can view published event', async () => {
      // First publish the event
      await anonClient
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId)
        .eq('organizer_id', mockOrganizerData.id);

      const { data, error } = await anonClient
        .from('events')
        .select()
        .eq('id', eventId)
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        title: 'Updated Marathon',
        status: 'published'
      });
    }, 5000);
  });

  describe('Registration Operations', () => {
    let eventId: string;
    let registrationId: string;

    beforeAll(async () => {
      // Create test event
      const { data } = await anonClient
        .from('events')
        .insert({
          id: 'test-event-id',
          title: 'Registration Test Marathon',
          date: new Date().toISOString(),
          status: 'published',
          organizer_id: mockOrganizerData.id
        })
        .select()
        .single();

      eventId = data.id;
    });

    it('runner can register for event', async () => {
      const mockRegistration = {
        id: 'test-registration-id',
        event_id: eventId,
        user_id: mockRunnerData.id,
        status: 'pending'
      };

      const { data, error } = await anonClient
        .from('registrations')
        .insert(mockRegistration)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject(mockRegistration);

      registrationId = data.id;
    }, 5000);

    it('volunteer can view registrations', async () => {
      const { data, error } = await anonClient
        .from('registrations')
        .select(`
          *,
          event:events(*),
          runner:profiles(*)
        `)
        .eq('id', registrationId);

      expect(error).toBeNull();
      expect(data[0]).toMatchObject({
        id: registrationId,
        status: 'pending'
      });
    }, 5000);

    it('runner can only view their own registrations (RLS)', async () => {
      const { error } = await anonClient
        .from('registrations')
        .select()
        .neq('user_id', mockRunnerData.id);

      expect(error).not.toBeNull();
    }, 5000);
  });

  describe('Real-time Subscriptions', () => {
    it('receives updates for registration status changes', (done) => {
      const registrationId = 'test-registration';
      
      const subscription = anonClient
        .channel('registration-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'registrations',
            filter: `id=eq.${registrationId}`
          },
          (payload) => {
            expect(payload.new.status).toBe('confirmed');
            subscription.unsubscribe();
            done();
          }
        )
        .subscribe();

      anonClient
        .from('registrations')
        .update({ status: 'confirmed' })
        .eq('id', registrationId);
    }, 5000);

    it('receives updates for event status changes', (done) => {
      const eventId = 'test-event';
      
      const subscription = anonClient
        .channel('event-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'events',
            filter: `id=eq.${eventId}`
          },
          (payload) => {
            expect(payload.new.status).toBe('published');
            subscription.unsubscribe();
            done();
          }
        )
        .subscribe();

      anonClient
        .from('events')
        .update({ status: 'published' })
        .eq('id', eventId);
    }, 5000);
  });

  describe('Registration Edge Cases', () => {
    let eventId: string;
    let ticketId: string;

    beforeAll(async () => {
      // Create test event and ticket
      const { data: eventData } = await anonClient
        .from('events')
        .insert({
          id: 'test-event-id',
          title: 'Edge Case Test Event',
          date: new Date().toISOString(),
          status: 'published',
          organizer_id: mockOrganizerData.id
        })
        .select()
        .single();

      eventId = eventData.id;

      const { data: ticketData } = await anonClient
        .from('tickets')
        .insert({
          id: 'test-ticket-id',
          event_id: eventId,
          name: 'Test Ticket',
          description: 'Test ticket for edge cases',
          price: 100.00,
          quantity: 1,
          max_per_user: 1,
          status: 'active'
        })
        .select()
        .single();

      ticketId = ticketData.id;
    });

    it('prevents registration when ticket is sold out', async () => {
      // First registration should succeed
      const { error: firstError } = await anonClient
        .from('registrations')
        .insert({
          id: 'test-registration-id',
          event_id: eventId,
          user_id: mockRunnerData.id,
          ticket_id: ticketId,
          status: 'pending'
        });

      expect(firstError).toBeNull();

      // Second registration should fail
      const { error: secondError } = await anonClient
        .from('registrations')
        .insert({
          id: 'test-registration-id',
          event_id: eventId,
          user_id: mockVolunteerData.id,
          ticket_id: ticketId,
          status: 'pending'
        });

      expect(secondError).not.toBeNull();
      expect(secondError.message).toContain('sold out');
    }, 5000);

    it('prevents registration for cancelled events', async () => {
      // Cancel the event
      await anonClient
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      // Attempt registration
      const { error } = await anonClient
        .from('registrations')
        .insert({
          id: 'test-registration-id',
          event_id: eventId,
          user_id: mockRunnerData.id,
          ticket_id: ticketId,
          status: 'pending'
        });

      expect(error).not.toBeNull();
      expect(error.message).toContain('cancelled');
    }, 5000);

    it('prevents registration after event date', async () => {
      // Update event to past date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await anonClient
        .from('events')
        .update({ 
          date: pastDate.toISOString(),
          status: 'published'
        })
        .eq('id', eventId);

      // Attempt registration
      const { error } = await anonClient
        .from('registrations')
        .insert({
          id: 'test-registration-id',
          event_id: eventId,
          user_id: mockRunnerData.id,
          ticket_id: ticketId,
          status: 'pending'
        });

      expect(error).not.toBeNull();
      expect(error.message).toContain('past');
    }, 5000);
  });

  const mockClient = {
    from: (table: string) => new MockQueryBuilder<TableRow<keyof Tables>>(mockDatabase[table as keyof typeof mockDatabase], mockDatabase),
    channel: (id: string) => ({
      on: (event: string, callback: (payload: any) => void) => ({
        subscribe: () => Promise.resolve()
      })
    })
  };

  test('create event', async () => {
    const mockData = { name: 'Test Event', date: '2024-01-01' };
    const mockQueryBuilder = mockClient.from('events');
    await mockQueryBuilder
      .insert(mockData, { returning: 'representation' })
      .eq('id', '123')
      .single();
  }, 5000);

  test('update registration status', async () => {
    const mockData = { status: 'confirmed' };
    const mockQueryBuilder = mockClient.from('registrations');
    await mockQueryBuilder
      .update(mockData, { returning: 'representation' })
      .eq('registrationId', '123')
      .single();
  }, 5000);

  test('delete registration', async () => {
    const mockQueryBuilder = mockClient.from('registrations');
    await mockQueryBuilder
      .delete({ returning: 'minimal' })
      .eq('registrationId', '123')
      .single();
  }, 5000);

  test('select registration', async () => {
    const mockQueryBuilder = mockClient.from('registrations');
    await mockQueryBuilder
      .select('*', { count: 'exact' })
      .eq('registrationId', '123')
      .single();
  }, 5000);

  test('subscription to registration status', async () => {
    const channel = mockClient.channel('registration_status');
    await channel
      .on('registration_update', (payload: { status: string }) => {
        expect(payload.status).toBe('confirmed');
      })
      .subscribe();
  }, 5000);

  test('subscription to event status', async () => {
    const channel = mockClient.channel('event_status');
    await channel
      .on('event_update', (payload: { status: string }) => {
        expect(payload.status).toBe('active');
      })
      .subscribe();
  }, 5000);

  test('should create a new registration', async () => {
    const registration = await mockClient.from('registrations')
      .insert({
        event_id: 'event-id',
        user_id: 'user-id',
        status: 'pending'
      })
      .single();

    expect(registration.data).toHaveProperty('id');
    expect((registration.data as Registration)?.status).toBe('pending');
  });

  test('should update registration status', async () => {
    const updated = await mockClient.from('registrations')
      .update({ status: 'confirmed' })
      .eq('id', 'test-id')
      .single();

    expect((updated.data as Registration)?.status).toBe('confirmed');
  });

  test('should delete registration', async () => {
    const deleted = await mockClient.from('registrations')
      .delete()
      .eq('id', 'test-id');

    expect(deleted.error).toBeNull();
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test data
    await anonClient.from('registrations').delete().eq('user_id', mockRunnerData.id);
    await anonClient.from('events').delete().eq('organizer_id', mockOrganizerData.id);
    await anonClient.from('profiles').delete().eq('id', 'test-user-1');
  });
}); 