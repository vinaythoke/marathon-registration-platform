import { signIn, signUp, signOut, googleSignIn } from '../auth';
import { supabase } from '../supabase';

// Mock the entire supabase module
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

describe('Authentication', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Email/Password Authentication', () => {
    it('successfully signs in with valid credentials', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'validPassword123'
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'test-id', email: mockCredentials.email } },
        error: null
      });

      const result = await signIn(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({
        id: 'test-id',
        email: mockCredentials.email
      });
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(mockCredentials);
    });

    it('handles invalid credentials', async () => {
      const mockCredentials = {
        email: 'test@example.com',
        password: 'wrongPassword'
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      });

      const result = await signIn(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('successfully signs up new user', async () => {
      const mockUser = {
        email: 'newuser@example.com',
        password: 'newPassword123',
        firstName: 'John',
        lastName: 'Doe'
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'new-id', email: mockUser.email } },
        error: null
      });

      const result = await signUp(mockUser);

      expect(result.success).toBe(true);
      expect(result.user).toMatchObject({
        id: 'new-id',
        email: mockUser.email
      });
    });

    it('handles signup with existing email', async () => {
      const mockUser = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Email already registered' }
      });

      const result = await signUp(mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });
  });

  describe('OAuth Authentication', () => {
    it('initiates Google sign in', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
        data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
        error: null
      });

      const result = await googleSignIn();

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        provider: 'google',
        url: expect.any(String)
      });
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google'
      });
    });

    it('handles Google sign in errors', async () => {
      (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'OAuth connection failed' }
      });

      const result = await googleSignIn();

      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth connection failed');
    });
  });

  describe('Sign Out', () => {
    it('successfully signs out user', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
        error: null
      });

      const result = await signOut();

      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('handles sign out errors', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
        error: { message: 'Session not found' }
      });

      const result = await signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session not found');
    });
  });
}); 