import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '../AuthForm';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}));

describe('AuthForm', () => {
  const mockPush = jest.fn();
  const mockGoogleSignIn = jest.fn();
  const mockSignIn = jest.fn();
  const mockSignUp = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  describe('Login Form', () => {
    it('renders login form correctly', () => {
      render(<AuthForm type="login" />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /don't have an account\? sign up/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
      mockSignIn.mockResolvedValueOnce({ success: true });
      render(<AuthForm type="login" signIn={mockSignIn} />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'You have been signed in successfully.',
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles failed login', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
      render(<AuthForm type="login" signIn={mockSignIn} />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'wrongpassword' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Invalid credentials',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Registration Form', () => {
    it('renders registration form correctly', () => {
      render(<AuthForm type="register" />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/select role/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('handles successful registration', async () => {
      mockSignUp.mockResolvedValueOnce({ success: true });
      render(<AuthForm type="register" signUp={mockSignUp} />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'John' },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'Doe' },
      });
      fireEvent.change(screen.getByLabelText(/select role/i), {
        target: { value: 'runner' },
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'runner',
        });
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Your account has been created successfully.',
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Google Sign In', () => {
    it('handles successful Google sign in', async () => {
      mockGoogleSignIn.mockResolvedValueOnce({ success: true });
      render(<AuthForm type="login" googleSignIn={mockGoogleSignIn} />);

      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(mockGoogleSignIn).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'You have been signed in successfully with Google.',
        });
      });
    });

    it('handles failed Google sign in', async () => {
      mockGoogleSignIn.mockRejectedValueOnce(new Error('Google authentication failed'));
      render(<AuthForm type="login" googleSignIn={mockGoogleSignIn} />);

      fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));

      await waitFor(() => {
        expect(mockGoogleSignIn).toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Google authentication failed',
          variant: 'destructive',
        });
      });
    });
  });

  describe('Form Switching', () => {
    it('switches from login to register', () => {
      render(<AuthForm type="login" />);
      fireEvent.click(screen.getByRole('button', { name: /don't have an account\? sign up/i }));
      expect(mockPush).toHaveBeenCalledWith('/auth/register');
    });

    it('switches from register to login', () => {
      render(<AuthForm type="register" />);
      fireEvent.click(screen.getByRole('button', { name: /already have an account\? sign in/i }));
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });
});