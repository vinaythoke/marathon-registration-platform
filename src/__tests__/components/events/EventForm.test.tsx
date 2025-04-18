import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '@/components/events/EventForm';
import { act } from 'react-dom/test-utils';
import { toast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/components/editor', () => ({
  Editor: ({ content, onChange }) => (
    <div data-testid="mock-editor">
      <textarea
        data-testid="mock-editor-textarea"
        defaultValue={content}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}));

jest.mock('@/components/image-upload', () => ({
  ImageUpload: ({ onImageUpload }) => (
    <div data-testid="mock-image-upload">
      <button 
        onClick={() => onImageUpload(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))}
        data-testid="mock-upload-button"
      >
        Upload
      </button>
    </div>
  ),
}));

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } }),
      }),
    },
  }),
}));

describe('EventForm Component', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders empty form correctly', () => {
    render(<EventForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/event title/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
    expect(screen.getByText(/event date/i)).toBeInTheDocument();
    expect(screen.getByText(/location/i)).toBeInTheDocument();
    expect(screen.getByText(/event type/i)).toBeInTheDocument();
    expect(screen.getByText(/capacity/i)).toBeInTheDocument();
  });

  test('renders form with initial data', () => {
    const initialData = {
      title: 'Test Marathon',
      description: '<p>Test description</p>',
      date: '2023-12-31',
      location: 'Test Location',
      type: 'marathon' as const,
      categories: ['road', 'charity'],
      capacity: 1000,
      registration_deadline: '2023-12-01',
      banner_url: 'https://test.com/image.jpg',
      banner_storage_path: 'test-path',
      status: 'draft' as const,
      ticket_types: [{
        name: 'Regular',
        price: 100,
        quantity: 500,
        visibility: 'public' as const
      }],
      discount_codes: []
    };

    render(<EventForm initialData={initialData} {...defaultProps} />);
    
    expect(screen.getByLabelText(/event title/i)).toHaveValue('Test Marathon');
    expect(screen.getByTestId('mock-editor-textarea')).toHaveValue('<p>Test description</p>');
    expect(screen.getByDisplayValue('Test Location')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<EventForm {...defaultProps} />);
    
    // Submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /save/i });
    await act(async () => {
      userEvent.click(submitButton);
    });
    
    // Check validation errors
    await waitFor(() => {
      expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/description must be at least 10 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/event date must be in the future/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('allows adding a ticket type', async () => {
    render(<EventForm {...defaultProps} />);
    
    // Click add ticket type button
    const addTicketButton = screen.getByRole('button', { name: /add ticket type/i });
    await act(async () => {
      userEvent.click(addTicketButton);
    });
    
    // Wait for ticket type fields to be added
    await waitFor(() => {
      expect(screen.getAllByLabelText(/ticket name/i)).toHaveLength(2);
    });
  });

  test('allows removing a ticket type', async () => {
    render(<EventForm {...defaultProps} />);
    
    // First add a new ticket type
    const addTicketButton = screen.getByRole('button', { name: /add ticket type/i });
    await act(async () => {
      userEvent.click(addTicketButton);
    });
    
    // Check we have 2 ticket types
    await waitFor(() => {
      expect(screen.getAllByLabelText(/ticket name/i)).toHaveLength(2);
    });
    
    // Now remove the second ticket type
    const removeButtons = screen.getAllByRole('button', { name: /remove ticket type/i });
    expect(removeButtons.length).toBe(1); // Only the second ticket has a remove button
    
    await act(async () => {
      userEvent.click(removeButtons[0]);
    });
    
    // Check we're back to 1 ticket type
    await waitFor(() => {
      expect(screen.getAllByLabelText(/ticket name/i)).toHaveLength(1);
    });
  });

  test('submits form with valid data', async () => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    
    const regDeadline = new Date();
    regDeadline.setDate(regDeadline.getDate() + 15);
    
    render(<EventForm {...defaultProps} />);
    
    // Fill out form
    await act(async () => {
      // Basic details
      await userEvent.type(screen.getByLabelText(/event title/i), 'New Test Marathon');
      await userEvent.type(screen.getByTestId('mock-editor-textarea'), 'This is a test description for the event that is long enough.');
      
      // Set date (we need to mock this separately)
      fireEvent.change(screen.getByLabelText(/event date/i), {
        target: { value: futureDate.toISOString().split('T')[0] },
      });
      
      // Set deadline (we need to mock this separately)
      fireEvent.change(screen.getByLabelText(/registration deadline/i), {
        target: { value: regDeadline.toISOString().split('T')[0] },
      });
      
      await userEvent.type(screen.getByLabelText(/location/i), 'Test Event Location');
      
      // Set capacity
      const capacityInput = screen.getByLabelText(/capacity/i);
      await userEvent.clear(capacityInput);
      await userEvent.type(capacityInput, '250');
      
      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /save/i }));
    });
    
    // Check if onSubmit was called with correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      const submitData = mockOnSubmit.mock.calls[0][0];
      expect(submitData.title).toBe('New Test Marathon');
      expect(submitData.description).toBe('This is a test description for the event that is long enough.');
      expect(submitData.location).toBe('Test Event Location');
      expect(submitData.capacity).toBe(250);
    });
  });

  test('displays image after upload', async () => {
    render(<EventForm {...defaultProps} />);
    
    // Trigger image upload
    const uploadButton = screen.getByTestId('mock-upload-button');
    await act(async () => {
      userEvent.click(uploadButton);
    });
    
    // Check if image url is set in the form
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('uploaded')
        })
      );
    });
  });
}); 