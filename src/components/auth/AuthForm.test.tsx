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

describe('AuthForm', () => {
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

  describe('Login Form', () => {
    it('renders login form elements', () => {
      render(<AuthForm type="login" />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
      (signIn as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { email: 'test@example.com' }
      });
      
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Signed in',
          description: 'You have been signed in successfully.'
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles login error', async () => {
      const errorMessage = 'Invalid credentials';
      (signIn as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: errorMessage
      });
      
      render(<AuthForm type="login" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'wrongpassword');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      });
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      });
    });
  });

  describe('Registration Form', () => {
    it('renders registration form elements', () => {
      render(<AuthForm type="register" />);
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('handles successful registration', async () => {
      (signUp as jest.Mock).mockResolvedValueOnce({
        success: true,
        user: { email: 'new@example.com' }
      });
      
      render(<AuthForm type="register" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      });
      
      await waitFor(() => {
        expect(signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123',
          firstName: '',
          lastName: ''
        });
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Account created',
          description: 'Your account has been created. Please check your email for verification.'
        });
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('validates password confirmation', async () => {
      render(<AuthForm type="register" />);
      
      await userEvent.type(screen.getByLabelText(/email/i), 'new@example.com');
      await userEvent.type(screen.getByLabelText("Password"), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'different-password');
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
      
      expect(signUp).not.toHaveBeenCalled();
    });
  });

  describe('Google Authentication', () => {
    it('handles Google sign-in', async () => {
      (googleSignIn as jest.Mock).mockResolvedValueOnce({
        success: true
      });
      
      render(<AuthForm type="login" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
      });
      
      await waitFor(() => {
        expect(googleSignIn).toHaveBeenCalled();
      });
    });
  });

  describe('Form Switching', () => {
    it('navigates from login to register form', async () => {
      render(<AuthForm type="login" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /don't have an account\? sign up/i }));
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/register');
      });
    });

    it('navigates from register to login form', async () => {
      render(<AuthForm type="register" />);
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /already have an account\? sign in/i }));
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });
}); 