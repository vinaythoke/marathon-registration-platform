import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketManager } from '@/components/events/TicketManager';
import { act } from 'react-dom/test-utils';
import { toast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'new-ticket-id',
              name: 'New Ticket',
              price: 25,
              quantity: 50,
              max_per_user: 2,
              start_date: new Date().toISOString(),
              end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
              status: 'active',
              event_id: 'test-event-id',
            },
          ],
          error: null,
        }),
      }),
      update: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      delete: jest.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      eq: jest.fn().mockReturnThis(),
    }),
  }),
}));

describe('TicketManager Component', () => {
  const defaultProps = {
    eventId: 'test-event-id',
    eventCapacity: 500,
    initialTickets: [
      {
        id: 'ticket1',
        event_id: 'test-event-id',
        name: 'Standard Ticket',
        description: 'Regular entry',
        price: 50,
        quantity: 200,
        max_per_user: 2,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        status: 'active',
      },
      {
        id: 'ticket2',
        event_id: 'test-event-id',
        name: 'VIP Ticket',
        description: 'Premium entry with benefits',
        price: 100,
        quantity: 50,
        max_per_user: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        status: 'active',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: new Date('2023-06-15') });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders tickets correctly', () => {
    render(<TicketManager {...defaultProps} />);
    
    expect(screen.getByText('Standard Ticket')).toBeInTheDocument();
    expect(screen.getByText('VIP Ticket')).toBeInTheDocument();
    expect(screen.getByText('₹50.00')).toBeInTheDocument();
    expect(screen.getByText('₹100.00')).toBeInTheDocument();
    expect(screen.getAllByText('Active')).toHaveLength(2);
  });

  test('shows capacity warning when tickets exceed capacity', () => {
    const props = {
      ...defaultProps,
      eventCapacity: 200, // Total ticket quantity is 250, so this should trigger warning
    };
    
    render(<TicketManager {...props} />);
    
    expect(screen.getByText(/warning/i)).toBeInTheDocument();
    expect(screen.getByText(/total ticket quantity \(250\) exceeds event capacity \(200\)/i)).toBeInTheDocument();
  });

  test('opens add ticket dialog', async () => {
    render(<TicketManager {...defaultProps} />);
    
    // Click add ticket button
    const addButton = screen.getByRole('button', { name: /add ticket type/i });
    await act(async () => {
      userEvent.click(addButton);
    });
    
    // Check if dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Ticket')).toBeInTheDocument();
  });

  test('opens edit ticket dialog', async () => {
    render(<TicketManager {...defaultProps} />);
    
    // Click edit button on first ticket
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await act(async () => {
      userEvent.click(editButtons[0]);
    });
    
    // Check if dialog is open with pre-filled data
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit Ticket')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Standard Ticket')).toBeInTheDocument();
  });

  test('opens delete confirmation dialog', async () => {
    render(<TicketManager {...defaultProps} />);
    
    // Click delete button on first ticket
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await act(async () => {
      userEvent.click(deleteButtons[0]);
    });
    
    // Check if dialog is open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete Ticket')).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  test('allows adding a new ticket', async () => {
    render(<TicketManager {...defaultProps} />);
    
    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add ticket type/i });
    await act(async () => {
      userEvent.click(addButton);
    });
    
    // Fill out form
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/ticket name/i), 'New Ticket');
      
      const priceInput = screen.getByLabelText(/price/i);
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, '25');
      
      const quantityInput = screen.getByLabelText(/quantity available/i);
      await userEvent.clear(quantityInput);
      await userEvent.type(quantityInput, '50');
      
      const maxPerUserInput = screen.getByLabelText(/max per user/i);
      await userEvent.clear(maxPerUserInput);
      await userEvent.type(maxPerUserInput, '2');
      
      // Save the ticket
      await userEvent.click(screen.getByRole('button', { name: /save ticket/i }));
    });
    
    // Check if success toast was shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ticket created',
        })
      );
    });
  });

  test('allows editing an existing ticket', async () => {
    render(<TicketManager {...defaultProps} />);
    
    // Click edit button on first ticket
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await act(async () => {
      userEvent.click(editButtons[0]);
    });
    
    // Update the name
    await act(async () => {
      const nameInput = screen.getByDisplayValue('Standard Ticket');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Standard Ticket');
      
      // Save the updated ticket
      await userEvent.click(screen.getByRole('button', { name: /save ticket/i }));
    });
    
    // Check if success toast was shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ticket updated',
        })
      );
    });
  });

  test('allows deleting a ticket', async () => {
    render(<TicketManager {...defaultProps} />);
    
    // Click delete button on first ticket
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await act(async () => {
      userEvent.click(deleteButtons[0]);
    });
    
    // Confirm deletion
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /delete$/i }));
    });
    
    // Check if success toast was shown
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ticket deleted',
        })
      );
    });
  });

  test('handles form validation errors', async () => {
    render(<TicketManager {...defaultProps} />);
    
    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add ticket type/i });
    await act(async () => {
      userEvent.click(addButton);
    });
    
    // Submit without filling required fields
    await act(async () => {
      const nameInput = screen.getByLabelText(/ticket name/i);
      await userEvent.clear(nameInput);
      
      // Try to save
      await userEvent.click(screen.getByRole('button', { name: /save ticket/i }));
    });
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  test('shows free instead of price for zero-cost tickets', () => {
    const propsWithFreeTicket = {
      ...defaultProps,
      initialTickets: [
        ...defaultProps.initialTickets,
        {
          id: 'ticket3',
          event_id: 'test-event-id',
          name: 'Free Entry',
          description: 'Complimentary ticket',
          price: 0,
          quantity: 50,
          max_per_user: 1,
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
          status: 'active',
        },
      ],
    };
    
    render(<TicketManager {...propsWithFreeTicket} />);
    
    expect(screen.getByText('Free Entry')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });
}); 