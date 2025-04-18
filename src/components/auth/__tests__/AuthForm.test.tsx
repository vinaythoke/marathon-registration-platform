import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from '../AuthForm';
import { signIn, signUp, googleSignIn } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  googleSignIn: jest.fn()
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn().mockReturnValue({ toast: jest.fn() })
}));

describe('AuthForm', () => {
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  describe('Login Form', () => {
    it('renders login form by default', () => {
      render(<AuthForm type="login" />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
      (signIn as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { email: 'test@example.com' }
      });

      render(<AuthForm type="login" />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Successfully signed in!'
        });
      });
    });

    it('handles failed login', async () => {
      (signIn as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials'
      });

      render(<AuthForm type="login" />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid credentials'
        });
      });
    });

    it('validates email format', async () => {
      render(<AuthForm type="login" />);

      await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument();
      expect(signIn).not.toHaveBeenCalled();
    });

    it('validates password length', async () => {
      render(<AuthForm type="login" />);

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'short');
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      expect(signIn).not.toHaveBeenCalled();
    });
  });

  describe('Registration Form', () => {
    beforeEach(() => {
      render(<AuthForm type="register" />);
    });

    it('renders registration form', () => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('handles successful registration', async () => {
      (signUp as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { email: 'new@example.com' }
      });

      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'new@example.com',
          password: 'password123'
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Registration successful! Please check your email to verify your account.'
        });
      });
    });
  });

  describe('Google Authentication', () => {
    it('handles Google sign in', async () => {
      (googleSignIn as jest.Mock).mockResolvedValueOnce({
        success: true,
        data: { provider: 'google', url: 'https://google.com/oauth' }
      });

      render(<AuthForm type="login" />);
      await userEvent.click(screen.getByRole('button', { name: /google/i }));

      await waitFor(() => {
        expect(googleSignIn).toHaveBeenCalled();
      });
    });

    it('handles Google sign in error', async () => {
      (googleSignIn as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Failed to connect to Google'
      });

      render(<AuthForm type="login" />);
      await userEvent.click(screen.getByRole('button', { name: /google/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to connect to Google'
        });
      });
    });
  });
}); 