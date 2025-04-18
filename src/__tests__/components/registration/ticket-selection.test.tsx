import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TicketSelection from '@/components/registration/TicketSelection';
import { useRegistration } from '@/components/registration/RegistrationContext';
import { createRegistration } from '@/lib/actions/registration';

// Mock the registration context
jest.mock('@/components/registration/RegistrationContext', () => ({
  useRegistration: jest.fn()
}));

// Mock the registration action
jest.mock('@/lib/actions/registration', () => ({
  createRegistration: jest.fn()
}));

describe('TicketSelection Component', () => {
  const mockEvent = {
    id: 'event-123',
    title: 'Test Marathon',
    description: 'A test marathon event',
    date: new Date().toISOString()
  };

  const mockTickets = [
    {
      id: 'ticket-1',
      name: 'Standard Entry',
      description: 'Regular marathon entry',
      price: 50.00,
      available_quantity: 10,
      features: ['Race entry', 'T-shirt', 'Medal']
    },
    {
      id: 'ticket-2',
      name: 'VIP Entry',
      description: 'VIP marathon entry with extras',
      price: 100.00,
      available_quantity: 5,
      features: ['Race entry', 'Premium T-shirt', 'Medal', 'VIP area access']
    },
    {
      id: 'ticket-3',
      name: 'Sold Out Ticket',
      description: 'This ticket is sold out',
      price: 25.00,
      available_quantity: 0,
      features: ['Basic entry']
    }
  ];

  const mockGoToNextStep = jest.fn();
  const mockSetSelectedTicket = jest.fn();
  const mockSetRegistrationId = jest.fn();
  const mockValidateCurrentStep = jest.fn().mockReturnValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRegistration as jest.Mock).mockReturnValue({
      tickets: mockTickets,
      event: mockEvent,
      selectedTicket: null,
      setSelectedTicket: mockSetSelectedTicket,
      goToNextStep: mockGoToNextStep,
      stepValidationErrors: {},
      validateCurrentStep: mockValidateCurrentStep,
      registrationId: null,
      setRegistrationId: mockSetRegistrationId
    });
  });

  test('renders ticket options correctly', () => {
    render(<TicketSelection />);
    
    expect(screen.getByText('Select Ticket')).toBeInTheDocument();
    expect(screen.getByText('Choose a ticket type for Test Marathon')).toBeInTheDocument();
    
    // Check if all tickets are displayed
    expect(screen.getByText('Standard Entry')).toBeInTheDocument();
    expect(screen.getByText('VIP Entry')).toBeInTheDocument();
    expect(screen.getByText('Sold Out Ticket')).toBeInTheDocument();
    
    // Check if prices are displayed correctly
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
    
    // Check if sold out badge is displayed
    expect(screen.getByText('Sold Out')).toBeInTheDocument();
  });

  test('allows selecting an available ticket', () => {
    render(<TicketSelection />);
    
    // Click on the first ticket (Standard Entry)
    fireEvent.click(screen.getByText('Standard Entry'));
    
    expect(mockSetSelectedTicket).toHaveBeenCalledWith(mockTickets[0]);
  });

  test('does not allow selecting a sold out ticket', () => {
    render(<TicketSelection />);
    
    // Click on the sold out ticket
    fireEvent.click(screen.getByText('Sold Out Ticket'));
    
    expect(mockSetSelectedTicket).not.toHaveBeenCalled();
  });

  test('continues to next step when valid ticket is selected', async () => {
    // Mock a selected ticket
    (useRegistration as jest.Mock).mockReturnValue({
      tickets: mockTickets,
      event: mockEvent,
      selectedTicket: mockTickets[0],
      setSelectedTicket: mockSetSelectedTicket,
      goToNextStep: mockGoToNextStep,
      stepValidationErrors: {},
      validateCurrentStep: mockValidateCurrentStep,
      registrationId: null,
      setRegistrationId: mockSetRegistrationId
    });
    
    // Mock successful registration creation
    (createRegistration as jest.Mock).mockResolvedValue({ 
      registrationId: 'reg-123',
      success: true 
    });
    
    render(<TicketSelection />);
    
    // Continue button should be enabled
    const continueButton = screen.getByText('Continue');
    expect(continueButton).not.toBeDisabled();
    
    // Click continue
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      // Check if registration was created
      expect(createRegistration).toHaveBeenCalledWith('event-123', 'ticket-1');
      
      // Check if registration ID was set
      expect(mockSetRegistrationId).toHaveBeenCalledWith('reg-123');
      
      // Check if we moved to the next step
      expect(mockGoToNextStep).toHaveBeenCalled();
    });
  });

  test('displays error when registration creation fails', async () => {
    // Mock a selected ticket
    (useRegistration as jest.Mock).mockReturnValue({
      tickets: mockTickets,
      event: mockEvent,
      selectedTicket: mockTickets[0],
      setSelectedTicket: mockSetSelectedTicket,
      goToNextStep: mockGoToNextStep,
      stepValidationErrors: {},
      validateCurrentStep: mockValidateCurrentStep,
      registrationId: null,
      setRegistrationId: mockSetRegistrationId
    });
    
    // Mock failed registration creation
    const errorMessage = 'Failed to create registration';
    (createRegistration as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<TicketSelection />);
    
    // Click continue
    fireEvent.click(screen.getByText('Continue'));
    
    await waitFor(() => {
      // Check if error message is displayed
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      
      // Check that we did not move to the next step
      expect(mockGoToNextStep).not.toHaveBeenCalled();
    });
  });

  test('skips registration creation if registrationId already exists', async () => {
    // Mock a selected ticket and existing registration ID
    (useRegistration as jest.Mock).mockReturnValue({
      tickets: mockTickets,
      event: mockEvent,
      selectedTicket: mockTickets[0],
      setSelectedTicket: mockSetSelectedTicket,
      goToNextStep: mockGoToNextStep,
      stepValidationErrors: {},
      validateCurrentStep: mockValidateCurrentStep,
      registrationId: 'existing-reg-123',
      setRegistrationId: mockSetRegistrationId
    });
    
    render(<TicketSelection />);
    
    // Click continue
    fireEvent.click(screen.getByText('Continue'));
    
    // Check that we moved to the next step without creating a new registration
    expect(createRegistration).not.toHaveBeenCalled();
    expect(mockGoToNextStep).toHaveBeenCalled();
  });

  test('displays all tickets sold out message when applicable', () => {
    // Mock all tickets as sold out
    const soldOutTickets = mockTickets.map(ticket => ({
      ...ticket,
      available_quantity: 0
    }));
    
    (useRegistration as jest.Mock).mockReturnValue({
      tickets: soldOutTickets,
      event: mockEvent,
      selectedTicket: null,
      setSelectedTicket: mockSetSelectedTicket,
      goToNextStep: mockGoToNextStep,
      stepValidationErrors: {},
      validateCurrentStep: mockValidateCurrentStep,
      registrationId: null,
      setRegistrationId: mockSetRegistrationId
    });
    
    render(<TicketSelection />);
    
    expect(screen.getByText('All tickets for this event are currently sold out.')).toBeInTheDocument();
    // Continue button should be disabled
    expect(screen.getByText('Continue')).toBeDisabled();
  });
}); 