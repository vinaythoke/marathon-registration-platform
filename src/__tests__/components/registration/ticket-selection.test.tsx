import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketSelection } from '@/components/registration/TicketSelection';
import { TicketTypeSchema, TicketType, TicketStatus } from '@/types/ticket';
import * as auth from '@/hooks/useAuth';

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

describe('TicketSelection', () => {
  const mockOnSelect = jest.fn();

  const baseTicket: TicketTypeSchema = {
    id: '1',
    event_id: 'event-1',
    name: 'Regular Ticket',
    description: 'Standard entry ticket',
    base_price: 100,
    type: 'REGULAR' as TicketType,
    quantity_total: 100,
    quantity_sold: 0,
    quantity_reserved: 0,
    status: 'ACTIVE' as TicketStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const runnerTicket: TicketTypeSchema = {
    ...baseTicket,
    id: '2',
    name: 'Runner Ticket',
    description: 'Ticket for runners only',
    visibility_rules: {
      restricted_to: ['runner']
    }
  };

  const organizerTicket: TicketTypeSchema = {
    ...baseTicket,
    id: '3',
    name: 'Organizer Ticket',
    description: 'Ticket for organizers only',
    visibility_rules: {
      restricted_to: ['organizer']
    }
  };

  const soldOutTicket: TicketTypeSchema = {
    ...baseTicket,
    id: '4',
    name: 'Sold Out Ticket',
    quantity_total: 10,
    quantity_sold: 10,
    quantity_reserved: 0,
    status: 'SOLD_OUT' as TicketStatus
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSelect.mockClear();
  });

  it('renders tickets without restrictions for all users', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[baseTicket]} 
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Regular Ticket')).toBeInTheDocument();
  });

  it('shows role-restricted tickets only to users with that role', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['runner'] } });
    
    render(
      <TicketSelection 
        tickets={[runnerTicket]} 
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Runner Ticket')).toBeInTheDocument();
  });

  it('shows all applicable tickets to users with multiple roles', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ 
      user: { roles: ['runner', 'organizer'] } 
    });
    
    render(
      <TicketSelection 
        tickets={[baseTicket, runnerTicket, organizerTicket]} 
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Regular Ticket')).toBeInTheDocument();
    expect(screen.getByText('Runner Ticket')).toBeInTheDocument();
    expect(screen.getByText('Organizer Ticket')).toBeInTheDocument();
  });

  it('handles users with no roles properly', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({
      user: null
    });

    render(
      <TicketSelection 
        tickets={[baseTicket, runnerTicket]} 
        onSelect={mockOnSelect}
      />
    );
    
    // Should only show unrestricted tickets
    expect(screen.getByText('Regular Ticket')).toBeInTheDocument();
    expect(screen.queryByText('Runner Ticket')).not.toBeInTheDocument();
  });

  it('calls onSelect with correct ticket ID and quantity when selecting a ticket', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[baseTicket]} 
        onSelect={mockOnSelect}
      />
    );

    const selectButton = screen.getByRole('button', { name: /select/i });
    fireEvent.click(selectButton);

    // Should be called with default quantity of 1
    expect(mockOnSelect).toHaveBeenCalledWith(baseTicket.id, 1);
  });

  it('calls onSelect with correct quantity after changing quantity', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[baseTicket]} 
        onSelect={mockOnSelect}
      />
    );

    // Increase quantity to 3
    const increaseButton = screen.getByRole('button', { name: /plus/i });
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);

    const selectButton = screen.getByRole('button', { name: /select 3 tickets/i });
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith(baseTicket.id, 3);
  });

  it('calls onSelect with minimum quantity from pricing rules', () => {
    const ticketWithMinimum: TicketTypeSchema = {
      ...baseTicket,
      pricing_rules: [{
        min_purchase: 2,
        max_purchase: 5,
        price: 90
      }]
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[ticketWithMinimum]} 
        onSelect={mockOnSelect}
      />
    );

    const selectButton = screen.getByRole('button', { name: /select 2 tickets/i });
    fireEvent.click(selectButton);

    // Should be called with minimum quantity of 2
    expect(mockOnSelect).toHaveBeenCalledWith(ticketWithMinimum.id, 2);
  });

  it('displays ticket price correctly', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[baseTicket]} 
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('₹100')).toBeInTheDocument();
  });

  it('displays ticket description', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[baseTicket]} 
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Standard entry ticket')).toBeInTheDocument();
  });

  it('handles sold out tickets correctly', () => {
    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[soldOutTicket]} 
        onSelect={mockOnSelect}
      />
    );

    const selectButton = screen.getByRole('button', { name: /select/i });
    expect(selectButton).toBeDisabled();
  });

  it('shows remaining quantity for tickets', () => {
    const partiallyFilledTicket: TicketTypeSchema = {
      ...baseTicket,
      quantity_total: 100,
      quantity_sold: 60,
      quantity_reserved: 10
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[partiallyFilledTicket]} 
        onSelect={mockOnSelect}
      />
    );

    // Available = Total - Sold - Reserved = 100 - 60 - 10 = 30
    expect(screen.getByText('30 tickets remaining')).toBeInTheDocument();
  });

  it('handles tickets with zero remaining quantity', () => {
    const noRemainingTicket: TicketTypeSchema = {
      ...baseTicket,
      quantity_total: 100,
      quantity_sold: 90,
      quantity_reserved: 10,
      status: 'ACTIVE' as TicketStatus
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[noRemainingTicket]} 
        onSelect={mockOnSelect}
      />
    );

    const selectButton = screen.getByRole('button', { name: /select/i });
    expect(selectButton).toBeDisabled();
    expect(screen.getByText('No tickets available')).toBeInTheDocument();
  });

  it('handles inactive tickets correctly', () => {
    const inactiveTicket: TicketTypeSchema = {
      ...baseTicket,
      status: 'INACTIVE' as TicketStatus
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[inactiveTicket]} 
        onSelect={mockOnSelect}
      />
    );

    // Inactive tickets should not be displayed at all
    expect(screen.queryByText('Regular Ticket')).not.toBeInTheDocument();
  });

  it('displays correct currency format for different prices', () => {
    const expensiveTicket: TicketTypeSchema = {
      ...baseTicket,
      base_price: 1500.50
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[expensiveTicket]} 
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('₹1,500.50')).toBeInTheDocument();
  });

  it('handles quantity selection within limits', () => {
    const ticketWithLimits: TicketTypeSchema = {
      ...baseTicket,
      pricing_rules: [{
        min_purchase: 2,
        max_purchase: 5,
        price: 90 // 10% off base price
      }]
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[ticketWithLimits]} 
        onSelect={mockOnSelect}
      />
    );

    // Initial quantity should be min_purchase (2)
    expect(screen.getByText('2')).toBeInTheDocument();

    // Try to decrease below minimum
    const decreaseButton = screen.getByRole('button', { name: /minus/i });
    fireEvent.click(decreaseButton);
    expect(screen.getByText('2')).toBeInTheDocument(); // Should stay at 2

    // Increase to maximum
    const increaseButton = screen.getByRole('button', { name: /plus/i });
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);
    fireEvent.click(increaseButton);
    expect(screen.getByText('5')).toBeInTheDocument();

    // Try to increase beyond maximum
    fireEvent.click(increaseButton);
    expect(screen.getByText('5')).toBeInTheDocument(); // Should stay at 5
  });

  it('validates access codes correctly', () => {
    const ticketWithAccessCode: TicketTypeSchema = {
      ...baseTicket,
      visibility_rules: {
        access_codes: ['VALID123']
      }
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[ticketWithAccessCode]} 
        onSelect={mockOnSelect}
      />
    );

    const accessCodeInput = screen.getByPlaceholderText('Enter access code');
    const selectButton = screen.getByRole('button', { name: /select/i });

    // Button should be disabled without access code
    expect(selectButton).toBeDisabled();

    // Enter invalid code
    fireEvent.change(accessCodeInput, { target: { value: 'INVALID' } });
    expect(selectButton).toBeDisabled();

    // Enter valid code
    fireEvent.change(accessCodeInput, { target: { value: 'VALID123' } });
    expect(selectButton).not.toBeDisabled();
  });

  it('applies pricing rules correctly', () => {
    const now = new Date();
    const ticketWithPricingRules: TicketTypeSchema = {
      ...baseTicket,
      pricing_rules: [
        {
          min_purchase: 1,
          max_purchase: 10,
          price: 80, // 20% off base price
          start_date: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
          end_date: new Date(now.getTime() + 86400000).toISOString() // Tomorrow
        }
      ]
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[ticketWithPricingRules]} 
        onSelect={mockOnSelect}
      />
    );

    // Base price is 100, with 20% discount = 80
    expect(screen.getByText('₹80')).toBeInTheDocument();
    expect(screen.getByText('Special price')).toBeInTheDocument();

    // Original price should be shown struck through
    expect(screen.getByText('₹100')).toHaveStyle({ textDecoration: 'line-through' });
  });

  it('shows tooltip for role-restricted tickets', () => {
    const multiRoleTicket: TicketTypeSchema = {
      ...baseTicket,
      visibility_rules: {
        restricted_to: ['runner', 'organizer']
      }
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['runner'] } });
    
    render(
      <TicketSelection 
        tickets={[multiRoleTicket]} 
        onSelect={mockOnSelect}
      />
    );

    const badge = screen.getByText('runner, organizer');
    expect(badge).toHaveClass('cursor-help');
    
    // The tooltip content should be in the document but hidden
    expect(screen.getByText('This ticket is restricted to runner or organizer only.')).toBeInTheDocument();
  });

  it('shows info message for tickets requiring access code', () => {
    const accessCodeTicket: TicketTypeSchema = {
      ...baseTicket,
      visibility_rules: {
        access_codes: ['CODE123']
      }
    };

    (auth.useAuth as jest.Mock).mockReturnValue({ user: { roles: ['user'] } });
    
    render(
      <TicketSelection 
        tickets={[accessCodeTicket]} 
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('This ticket requires an access code')).toBeInTheDocument();
  });
}); 