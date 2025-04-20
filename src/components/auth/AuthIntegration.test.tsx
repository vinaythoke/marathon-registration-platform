import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from './AuthForm';
import '@testing-library/jest-dom';
import { signIn, signUp, googleSignIn } from '@/lib/auth';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  googleSignIn: jest.fn()
}));

// Mock the toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn()
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

describe('Authentication Integration Tests', () => {
  const mockToast = jest.fn();
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (useRouter as jest.Mock).mockReturnValue({ 
      push: mockPush,
      refresh: mockRefresh
    });
  });

  describe('Complete Login Flow', () => {
    it('should validate email format', async () => {
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      
      expect(signIn).not.toHaveBeenCalled();
    });

    it('should validate password length', async () => {
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'short');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
      
      expect(signIn).not.toHaveBeenCalled();
    });

    it('handles network error during login', async () => {
      (signIn as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
          variant: 'destructive'
        });
      });
    });

    it('shows loading state during login', async () => {
      // Create a promise that we control to delay the mock response
      let resolveSignIn: (value: any) => void;
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve;
      });
      
      (signIn as jest.Mock).mockImplementationOnce(() => signInPromise);
      
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      // Check that the button is in loading state
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeDisabled();
      expect(signInButton.querySelector('svg')).toBeInTheDocument(); // Check for the loading spinner
      
      // Resolve the promise to complete the login
      await act(async () => {
        resolveSignIn({ success: true, user: { email: 'test@example.com' } });
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Complete Registration Flow', () => {
    it('should validate email format for registration', async () => {
      render(<AuthForm type="register" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      
      expect(signUp).not.toHaveBeenCalled();
    });

    it('should validate password requirements during registration', async () => {
      render(<AuthForm type="register" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'short');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'short');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
      
      expect(signUp).not.toHaveBeenCalled();
    });
    
    it('handles registration error from server', async () => {
      const errorMessage = 'Email already in use';
      (signUp as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: errorMessage
      });
      
      render(<AuthForm type="register" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      });
    });

    it('shows loading state during registration', async () => {
      // Create a promise that we control to delay the mock response
      let resolveSignUp: (value: any) => void;
      const signUpPromise = new Promise(resolve => {
        resolveSignUp = resolve;
      });
      
      (signUp as jest.Mock).mockImplementationOnce(() => signUpPromise);
      
      render(<AuthForm type="register" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      });
      
      // Check that the button is in loading state
      const createButton = screen.getByRole('button', { name: /create account/i });
      expect(createButton).toBeDisabled();
      expect(createButton.querySelector('svg')).toBeInTheDocument(); // Check for the loading spinner
      
      // Resolve the promise to complete the registration
      await act(async () => {
        resolveSignUp({ success: true, user: { email: 'new@example.com' } });
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Google Authentication Flow', () => {
    it('handles Google sign-in error', async () => {
      const errorMessage = 'Google authentication failed';
      (googleSignIn as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: errorMessage
      });
      
      render(<AuthForm type="login" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      });
    });

    it('redirects after successful Google sign-in', async () => {
      (googleSignIn as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { email: 'google@example.com' }
      });
      
      render(<AuthForm type="login" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      });
      
      await waitFor(() => {
        expect(googleSignIn).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Signed in',
          description: 'You have been signed in successfully with Google.'
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Form Field Interaction', () => {
    it('clears validation errors when fixing input', async () => {
      render(<AuthForm type="login" />);
      
      // First trigger an error
      await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
      
      // Now fix the input
      await userEvent.clear(screen.getByLabelText(/email/i));
      await userEvent.type(screen.getByLabelText(/email/i), 'valid@example.com');
      
      // Check that the error is no longer displayed
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('maintains form state during type toggle without submission', async () => {
      render(<AuthForm type="login" />);
      
      // Fill out the login form
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      
      // Switch to register
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /don't have an account\? sign up/i }));
      });
      
      // Now we're in register mode and the form should be reset
      expect(mockPush).toHaveBeenCalledWith('/auth/register');
    });
  });
}); 