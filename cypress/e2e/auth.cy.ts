/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear cookies and localStorage before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.viewport(1280, 720);
  });

  describe('Login', () => {
    it('should navigate to login page', () => {
      cy.visit('/');
      cy.get('a[href*="login"]').click();
      cy.url().should('include', '/login');
      cy.get('h1').should('contain', 'Sign In');
    });

    it('should show validation errors for empty form submission', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();
      
      // Check for validation error messages
      cy.contains('Please enter your email').should('be.visible');
      cy.contains('Please enter your password').should('be.visible');
    });

    it('should validate email format', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Invalid email address').should('be.visible');
    });

    it('should validate password length', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('short');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Password must be at least 8 characters').should('be.visible');
    });

    it('should show error message for incorrect credentials', () => {
      // Intercept the sign-in request and mock a failed response
      cy.intercept('POST', '**/auth/v1/token*', {
        statusCode: 400,
        body: {
          error: 'Invalid login credentials',
          error_description: 'Invalid login credentials'
        }
      }).as('signInRequest');

      cy.visit('/login');
      cy.get('input[name="email"]').type('wrong@example.com');
      cy.get('input[name="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@signInRequest');
      cy.contains('Invalid login credentials').should('be.visible');
    });

    it('should successfully login with valid credentials', () => {
      // Intercept the sign-in request and mock a successful response
      cy.intercept('POST', '**/auth/v1/token*', {
        statusCode: 200,
        body: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: '123',
            email: 'test@example.com'
          }
        }
      }).as('signInRequest');

      cy.visit('/login');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@signInRequest');
      
      // Should redirect to dashboard after successful login
      cy.url().should('include', '/dashboard');
    });

    it('should navigate to registration page', () => {
      cy.visit('/login');
      cy.contains("Don't have an account? Sign up").click();
      cy.url().should('include', '/register');
    });
  });

  describe('Registration', () => {
    it('should navigate to registration page', () => {
      cy.visit('/');
      cy.get('a[href*="register"]').click();
      cy.url().should('include', '/register');
      cy.get('h1').should('contain', 'Create an Account');
    });

    it('should show validation errors for empty form submission', () => {
      cy.visit('/register');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Please enter your email').should('be.visible');
      cy.contains('Please enter your password').should('be.visible');
      cy.contains('Please confirm your password').should('be.visible');
    });

    it('should validate email format for registration', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').type('invalid-email');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Invalid email address').should('be.visible');
    });

    it('should validate password matching', () => {
      cy.visit('/register');
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('different123');
      cy.get('button[type="submit"]').click();
      
      cy.contains('Passwords do not match').should('be.visible');
    });

    it('should show error for existing email', () => {
      // Intercept the sign-up request and mock a failed response for existing email
      cy.intercept('POST', '**/auth/v1/signup*', {
        statusCode: 400,
        body: {
          error: 'User already registered',
          message: 'User already registered'
        }
      }).as('signUpRequest');

      cy.visit('/register');
      cy.get('input[name="email"]').type('existing@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@signUpRequest');
      cy.contains('User already registered').should('be.visible');
    });

    it('should successfully register a new user', () => {
      // Intercept the sign-up request and mock a successful response
      cy.intercept('POST', '**/auth/v1/signup*', {
        statusCode: 200,
        body: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: '456',
            email: 'new@example.com'
          }
        }
      }).as('signUpRequest');

      cy.visit('/register');
      cy.get('input[name="email"]').type('new@example.com');
      cy.get('input[name="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@signUpRequest');
      
      // Should redirect to dashboard after successful registration
      cy.url().should('include', '/dashboard');
    });

    it('should navigate to login page', () => {
      cy.visit('/register');
      cy.contains('Already have an account? Sign in').click();
      cy.url().should('include', '/login');
    });
  });

  describe('Google Authentication', () => {
    it('should show Google authentication button', () => {
      cy.visit('/login');
      cy.contains('Continue with Google').should('be.visible');
    });

    it('should attempt Google sign-in when button is clicked', () => {
      // This is a limited test since we can't fully test OAuth flow in E2E
      // We can intercept the redirect to Google's OAuth page
      cy.intercept('**/oauth/v2/auth*').as('googleOAuthRedirect');
      
      cy.visit('/login');
      cy.contains('Continue with Google').click();
      
      // Just verify we tried to redirect to Google
      cy.wait('@googleOAuthRedirect');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should allow access to protected route when authenticated', () => {
      // Mock the authentication status
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'fake-token',
          refresh_token: 'fake-refresh-token',
          user: { id: '123', email: 'test@example.com' }
        }
      }));
      
      // Intercept user check in middleware and return success
      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 200,
        body: { id: '123', email: 'test@example.com' }
      }).as('userCheck');
      
      cy.visit('/dashboard');
      
      // Should stay on dashboard because we're logged in
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Logout Flow', () => {
    it('should successfully log out', () => {
      // Mock the authentication status
      window.localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: {
          access_token: 'fake-token',
          refresh_token: 'fake-refresh-token',
          user: { id: '123', email: 'test@example.com' }
        }
      }));
      
      // Intercept user check and logout requests
      cy.intercept('GET', '**/auth/v1/user', {
        statusCode: 200,
        body: { id: '123', email: 'test@example.com' }
      }).as('userCheck');
      
      cy.intercept('POST', '**/auth/v1/logout', {
        statusCode: 200,
        body: {}
      }).as('logoutRequest');
      
      cy.visit('/dashboard');
      
      // Find and click logout button
      cy.contains('Logout').click();
      
      cy.wait('@logoutRequest');
      
      // Should be redirected to login page
      cy.url().should('include', '/login');
    });
  });
}); 