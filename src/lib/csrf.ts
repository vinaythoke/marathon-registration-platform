/**
 * CSRF Protection Utilities
 * 
 * This module provides utilities for CSRF protection:
 * - generateCsrfToken: Creates a cryptographically secure random token
 * - validateCsrfToken: Verifies the token is valid and not expired
 * - getCsrfTokenFromCookies: Retrieves the token from cookies
 */

import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';

// CSRF token configuration
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Generate a new CSRF token and store it in a cookie
 * @returns {string} The generated CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  // Generate a random token
  const token = randomBytes(32).toString('hex');
  
  // Create a timestamp for expiry checking
  const timestamp = Date.now().toString();
  
  // Combine token and timestamp
  const tokenWithTimestamp = `${token}|${timestamp}`;
  
  // Set the cookie
  cookies().set({
    name: CSRF_COOKIE_NAME,
    value: tokenWithTimestamp,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: TOKEN_EXPIRY / 1000 // Convert to seconds for cookie
  });
  
  // Return just the token part for form inclusion
  return token;
}

/**
 * Validate a CSRF token against the one stored in cookies
 * @param {string} token - The token to validate
 * @returns {boolean} Whether the token is valid
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  // Get the token from cookies
  const storedTokenWithTimestamp = cookies().get(CSRF_COOKIE_NAME)?.value;
  
  if (!storedTokenWithTimestamp) {
    return false;
  }
  
  // Split the token and timestamp
  const [storedToken, timestampStr] = storedTokenWithTimestamp.split('|');
  
  if (!storedToken || !timestampStr) {
    return false;
  }
  
  // Check if token has expired
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > TOKEN_EXPIRY) {
    return false;
  }
  
  // Compare the tokens using a timing-safe comparison
  // This helps prevent timing attacks
  return timingSafeEqual(token, storedToken);
}

/**
 * Get the CSRF token from cookies for server-side validation
 * @returns {string | null} The CSRF token or null if not found
 */
export function getCsrfTokenFromCookies(): string | null {
  const tokenWithTimestamp = cookies().get(CSRF_COOKIE_NAME)?.value;
  
  if (!tokenWithTimestamp) {
    return null;
  }
  
  const [token] = tokenWithTimestamp.split('|');
  return token || null;
}

/**
 * Create a CSRF middleware wrapper for server actions
 * @param {Function} action - The server action to protect
 * @returns {Function} The protected server action
 */
export function withCsrf(action: Function) {
  return async (formData: FormData, ...args: any[]) => {
    const token = formData.get('csrf_token') as string;
    
    if (!token || !(await validateCsrfToken(token))) {
      throw new Error('CSRF token validation failed');
    }
    
    // If validation passes, call the original action
    return action(formData, ...args);
  };
}

/**
 * Get the CSRF header name for client-side code
 * @returns {string} The CSRF header name
 */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Perform a timing-safe comparison of two strings
 * This helps prevent timing attacks where an attacker could
 * determine parts of the token by measuring response times
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  // Use crypto's timing-safe equal if available (Node.js)
  if (typeof createHash === 'function') {
    const aHash = createHash('sha256').update(a).digest();
    const bHash = createHash('sha256').update(b).digest();
    return aHash.equals(bHash);
  }
  
  // Fallback implementation
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
} 