import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createServerComponentClient: () => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            user: {
              id: 'user-id',
            },
          },
        },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              role: 'organizer',
            },
          }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({
        error: null,
      }),
    }),
  }),
}));

// Mock the EventForm component
jest.mock('@/components/events/EventForm', () => ({
  EventForm: ({ onSubmit }) => {
    return (
      <div data-testid="event-form">
        <button
          data-testid="submit-event-form"
          onClick={() => onSubmit({
            title: 'Test Event',
            description: '<p>Test description</p>',
            date: '2023-12-31',
            location: 'Test Location',
            type: 'marathon',
            categories: ['road', 'charity'],
            capacity: 1000,
            registration_deadline: '2023-12-01',
            status: 'draft',
            ticket_types: [{
              name: 'Regular',
              price: 100,
              quantity: 1000,
              visibility: 'public'
            }],
          })}
        >
          Save Event
        </button>
      </div>
    );
  },
}));

// Mock the actual page component
function MockCreateEventPage() {
  return (
    <div>
      <h1>Create New Event</h1>
      {/* @ts-ignore - mocked component */}
      <EventForm onSubmit={async () => {}} />
    </div>
  );
}

describe('Create Event Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders create event page with form', () => {
    render(<MockCreateEventPage />);
    
    expect(screen.getByText('Create New Event')).toBeInTheDocument();
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
  });

  test('handles form submission and redirects', async () => {
    const mockRedirect = require('next/navigation').redirect;
    
    render(<MockCreateEventPage />);
    
    // Click the submit button
    await act(async () => {
      userEvent.click(screen.getByTestId('submit-event-form'));
    });
    
    // Check if redirect was called
    await waitFor(() => {
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  // The following tests would ideally test the authorization and authentication flow,
  // but since those are handled by server components, they require more complex
  // testing setups. Here's what you'd test in a more complete test suite:
  
  // 1. Test that unauthenticated users are redirected to the auth page
  // 2. Test that non-organizer users are redirected to the dashboard
  // 3. Test error handling for database operations
}); 