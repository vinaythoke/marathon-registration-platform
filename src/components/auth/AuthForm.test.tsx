import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthForm } from './AuthForm';
import '@testing-library/jest-dom';

// Mock the useToast hook
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock the auth functions
const mockSignIn = jest.fn();
const mockCreateUser = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockResetPassword = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signUp: (...args: any[]) => mockCreateUser(...args),
      signInWithOAuth: (...args: any[]) => mockGoogleSignIn(...args),
      resetPasswordForEmail: (...args: any[]) => mockResetPassword(...args)
    }
  }
}));

describe('AuthForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Form', () => {
    it('renders login form elements', () => {
      render(<AuthForm type="login" />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
      mockSignIn.mockResolvedValueOnce({ error: null });
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('handles failed login', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error',
          description: 'Invalid credentials'
        }));
      });
    });
  });

  describe('Registration Form', () => {
    beforeEach(() => {
      render(<AuthForm type="register" />);
    });

    it('renders registration form elements', () => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('validates first and last name fields', async () => {
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.type(screen.getByLabelText(/first name/i), 'a'); // Too short
      await userEvent.type(screen.getByLabelText(/last name/i), 'b'); // Too short
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
        expect(screen.getByText(/last name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during registration', async () => {
      mockCreateUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      });
      
      expect(screen.getByRole('button', { name: /loading/i })).toBeInTheDocument();
    });

    it('shows success toast on successful registration', async () => {
      mockCreateUser.mockResolvedValueOnce({ error: null });
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      await userEvent.type(screen.getByLabelText(/first name/i), 'John');
      await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Registration successful'
        }));
      });
    });
  });

  describe('Reset Password Form', () => {
    beforeEach(() => {
      render(<AuthForm type="reset-password" />);
    });

    it('renders reset password form elements', () => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    });

    it('handles successful password reset request', async () => {
      mockResetPassword.mockResolvedValueOnce({ error: null });
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Password reset email sent'
        }));
      });
    });

    it('handles reset password error', async () => {
      const errorMessage = 'User not found';
      mockResetPassword.mockRejectedValueOnce(new Error(errorMessage));
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /reset password/i }));
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error',
          description: errorMessage
        }));
      });
    });
  });

  describe('Google Authentication', () => {
    it('handles Google sign-in', async () => {
      mockGoogleSignIn.mockResolvedValueOnce({ error: null });
      render(<AuthForm type="login" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      });
      
      await waitFor(() => {
        expect(mockGoogleSignIn).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: expect.stringContaining('/auth/callback')
          }
        });
      });
    });
  });

  describe('Redirect Behavior', () => {
    it('redirects to specified path after successful login', async () => {
      const customRedirect = '/custom-path';
      mockSignIn.mockResolvedValueOnce({ error: null });
      
      render(<AuthForm type="login" redirectTo={customRedirect} />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(customRedirect);
      });
    });

    it('redirects to dashboard by default after successful login', async () => {
      mockSignIn.mockResolvedValueOnce({ error: null });
      
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/password/i), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
}); 