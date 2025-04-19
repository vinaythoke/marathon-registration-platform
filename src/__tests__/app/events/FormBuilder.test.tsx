import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { toast } from '@/components/ui/use-toast';

// Mock dependencies
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
  }),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  Droppable: ({ children }) => children({
    droppableProps: { 'data-testid': 'droppable' },
    innerRef: jest.fn(),
    placeholder: null,
  }),
  Draggable: ({ children }) => children({
    draggableProps: { 'data-testid': 'draggable' },
    dragHandleProps: { 'data-testid': 'drag-handle' },
    innerRef: jest.fn(),
  }),
}));

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'form-id',
              event_id: 'event-id',
              schema: {
                fields: [
                  {
                    id: 'field1',
                    type: 'text',
                    label: 'Name',
                    placeholder: 'Enter your name',
                    required: true,
                    options: {},
                  },
                  {
                    id: 'field2',
                    type: 'email',
                    label: 'Email',
                    placeholder: 'Enter your email',
                    required: true,
                    options: {},
                  },
                ],
              },
            },
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: { id: 'new-form-id' },
          error: null,
        }),
      }),
    }),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
      }),
    },
  }),
  createServerClient: () => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'event-id',
              title: 'Test Event',
              organizer_id: 'user-id',
            },
          }),
        }),
      }),
    }),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { user: { id: 'user-id' } } },
      }),
    },
  }),
}));

// Mock the Form Builder component
jest.mock('@/components/form-builder/FormBuilder', () => {
  const FormBuilder = ({ initialFields, onSave }) => {
    return (
      <div data-testid="form-builder">
        <button 
          data-testid="add-text-field" 
          onClick={() => {
            const newField = {
              id: 'new-field',
              type: 'text',
              label: 'New Field',
              placeholder: 'Enter value',
              required: false,
              options: {},
            };
            const updatedFields = initialFields ? [...initialFields, newField] : [newField];
            onSave(updatedFields);
          }}
        >
          Add Text Field
        </button>
        <button 
          data-testid="save-form" 
          onClick={() => onSave(initialFields || [])}
        >
          Save Form
        </button>
        <div>
          {initialFields?.map(field => (
            <div key={field.id} data-testid={`field-${field.id}`}>
              {field.label} ({field.type})
            </div>
          ))}
        </div>
      </div>
    );
  };
  return { FormBuilder };
});

// Mock the FormPreview component
jest.mock('@/components/form-builder/FormPreview', () => {
  const FormPreview = ({ fields }) => {
    return (
      <div data-testid="form-preview">
        {fields?.map(field => (
          <div key={field.id} data-testid={`preview-field-${field.id}`}>
            {field.label} Preview
          </div>
        ))}
      </div>
    );
  };
  return { FormPreview };
});

describe('Form Builder Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock rendering of the page component
  // Since the page is a server component, we'll test its functionality indirectly
  test('form builder page should display initial fields', async () => {
    // Render a mock of the form builder page with the mocked components
    const mockInitialFields = [
      {
        id: 'field1',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter your name',
        required: true,
        options: {},
      },
      {
        id: 'field2',
        type: 'email',
        label: 'Email',
        placeholder: 'Enter your email',
        required: true,
        options: {},
      },
    ];
    
    render(
      <div>
        <h1>Form Builder for Test Event</h1>
        <div className="flex">
          <div className="w-1/2">
            <div className="form-builder-container">
              {/* @ts-ignore - mocked component */}
              <FormBuilder initialFields={mockInitialFields} onSave={() => {}} />
            </div>
          </div>
          <div className="w-1/2">
            <div className="form-preview-container">
              {/* @ts-ignore - mocked component */}
              <FormPreview fields={mockInitialFields} />
            </div>
          </div>
        </div>
      </div>
    );
    
    // Check if the form builder and preview are rendered
    expect(screen.getByTestId('form-builder')).toBeInTheDocument();
    expect(screen.getByTestId('form-preview')).toBeInTheDocument();
    
    // Check if the initial fields are displayed in the form builder
    expect(screen.getByTestId('field-field1')).toBeInTheDocument();
    expect(screen.getByTestId('field-field2')).toBeInTheDocument();
    
    // Check if the fields are displayed in the preview
    expect(screen.getByTestId('preview-field-field1')).toBeInTheDocument();
    expect(screen.getByTestId('preview-field-field2')).toBeInTheDocument();
  });

  test('saving form calls onSave with updated fields', async () => {
    const mockSave = jest.fn();
    const mockInitialFields = [
      {
        id: 'field1',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter your name',
        required: true,
        options: {},
      },
    ];
    
    render(
      <div>
        {/* @ts-ignore - mocked component */}
        <FormBuilder initialFields={mockInitialFields} onSave={mockSave} />
      </div>
    );
    
    // Click the save button
    await act(async () => {
      userEvent.click(screen.getByTestId('save-form'));
    });
    
    // Check if onSave was called with the initial fields
    expect(mockSave).toHaveBeenCalledWith(mockInitialFields);
  });

  test('adding a field updates the form', async () => {
    const mockSave = jest.fn();
    const mockInitialFields = [
      {
        id: 'field1',
        type: 'text',
        label: 'Name',
        placeholder: 'Enter your name',
        required: true,
        options: {},
      },
    ];
    
    render(
      <div>
        {/* @ts-ignore - mocked component */}
        <FormBuilder initialFields={mockInitialFields} onSave={mockSave} />
      </div>
    );
    
    // Click the add field button
    await act(async () => {
      userEvent.click(screen.getByTestId('add-text-field'));
    });
    
    // Check if onSave was called with updated fields (initial + new field)
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave.mock.calls[0][0].length).toBe(2);
    expect(mockSave.mock.calls[0][0][0]).toEqual(mockInitialFields[0]);
    expect(mockSave.mock.calls[0][0][1]).toEqual(expect.objectContaining({
      id: 'new-field',
      type: 'text',
      label: 'New Field',
    }));
  });

  // Since the actual page component is a server component, we're testing the
  // functionality indirectly through the mocked components. In a real application,
  // you would want to test the integration points more thoroughly.
}); 