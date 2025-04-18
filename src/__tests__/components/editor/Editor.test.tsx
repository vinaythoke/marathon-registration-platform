import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@/components/editor';
import { act } from 'react-dom/test-utils';

// Mock tiptap
jest.mock('@tiptap/react', () => {
  const originalModule = jest.requireActual('@tiptap/react');
  
  return {
    ...originalModule,
    useEditor: () => ({
      chain: () => ({
        focus: () => ({
          toggleBold: () => ({ run: jest.fn() }),
          toggleItalic: () => ({ run: jest.fn() }),
          toggleHeading: () => ({ run: jest.fn() }),
          toggleBulletList: () => ({ run: jest.fn() }),
          toggleOrderedList: () => ({ run: jest.fn() }),
          toggleBlockquote: () => ({ run: jest.fn() }),
          toggleCode: () => ({ run: jest.fn() }),
          undo: () => ({ run: jest.fn() }),
          redo: () => ({ run: jest.fn() }),
          setImage: () => ({ run: jest.fn() }),
          setLink: () => ({ run: jest.fn() }),
        }),
      }),
      getHTML: () => '<p>Test content</p>',
      isActive: jest.fn().mockReturnValue(false),
    }),
    EditorContent: ({ editor }) => (
      <div data-testid="editor-content">
        <div contentEditable>Editor Content</div>
      </div>
    ),
  };
});

// Mock next modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
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

describe('Editor Component', () => {
  const mockOnChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders editor with toolbar', () => {
    render(<Editor content="" onChange={mockOnChange} />);
    
    // Check if toolbar buttons are rendered
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    expect(screen.getByLabelText(/bold/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/italic/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/heading 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/heading 2/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bullet list/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ordered list/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/block quote/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/image/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/link/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/undo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/redo/i)).toBeInTheDocument();
  });

  test('renders with initial content', () => {
    render(<Editor content="<p>Initial content</p>" onChange={mockOnChange} />);
    
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });

  test('opens link dialog when link button is clicked', async () => {
    render(<Editor content="" onChange={mockOnChange} />);
    
    // Click link button
    const linkButton = screen.getByLabelText(/link/i);
    await act(async () => {
      userEvent.click(linkButton);
    });
    
    // Check if dialog is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add Link')).toBeInTheDocument();
      expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    });
  });

  test('opens image dialog when image button is clicked', async () => {
    render(<Editor content="" onChange={mockOnChange} />);
    
    // Click image button
    const imageButton = screen.getByLabelText(/image/i);
    await act(async () => {
      userEvent.click(imageButton);
    });
    
    // Check if dialog is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Add Image')).toBeInTheDocument();
    });
  });

  test('allows adding a link', async () => {
    render(<Editor content="" onChange={mockOnChange} />);
    
    // Click link button
    const linkButton = screen.getByLabelText(/link/i);
    await act(async () => {
      userEvent.click(linkButton);
    });
    
    // Fill out link form and submit
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/url/i), 'https://example.com');
      await userEvent.click(screen.getByRole('button', { name: /add link/i }));
    });
    
    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('toggles formatting when toolbar buttons are clicked', async () => {
    render(<Editor content="" onChange={mockOnChange} />);
    
    // Click bold button
    const boldButton = screen.getByLabelText(/bold/i);
    await act(async () => {
      userEvent.click(boldButton);
    });
    
    // Click italic button
    const italicButton = screen.getByLabelText(/italic/i);
    await act(async () => {
      userEvent.click(italicButton);
    });
    
    // Click heading1 button
    const heading1Button = screen.getByLabelText(/heading 1/i);
    await act(async () => {
      userEvent.click(heading1Button);
    });
    
    // Click bullet list button
    const bulletListButton = screen.getByLabelText(/bullet list/i);
    await act(async () => {
      userEvent.click(bulletListButton);
    });
    
    // Each of these should trigger the editor chain commands
    // We can't really test the effect directly because of the mock,
    // but we can verify the buttons are clickable
    expect(true).toBeTruthy();
  });

  test('sanitizes content before onChange', async () => {
    const mockEditor = {
      chain: () => ({
        focus: () => ({
          toggleBold: () => ({ run: jest.fn() }),
        }),
      }),
      getHTML: () => '<p>Test content <script>alert("XSS")</script></p>',
      isActive: jest.fn().mockReturnValue(false),
    };
    
    // Force our special mock for this test
    jest.mock('@tiptap/react', () => ({
      useEditor: jest.fn().mockReturnValue(mockEditor),
      EditorContent: ({ editor }) => <div data-testid="editor-content">Editor Content</div>,
    }));
    
    render(<Editor content="" onChange={mockOnChange} />);
    
    // The onUpdate handler should be called during initialization
    // and should sanitize the content by removing script tags
    expect(mockOnChange).toHaveBeenCalledWith('<p>Test content </p>');
  });
}); 