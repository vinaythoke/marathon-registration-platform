'use client';

import { useEffect, useState } from 'react';
import { generateCsrfToken } from '@/lib/csrf';

/**
 * Props for the CsrfToken component
 */
interface CsrfTokenProps {
  /**
   * Callback function to handle token generation errors
   */
  onError?: (error: any) => void;
}

/**
 * Component that adds CSRF protection to forms
 * This component renders a hidden input field with a CSRF token
 * 
 * Example usage:
 * ```jsx
 * <form action={myServerAction}>
 *   <CsrfToken />
 *   <input type="text" name="username" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
export function CsrfToken({ onError }: CsrfTokenProps) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Generate a CSRF token when the component mounts
    const fetchToken = async () => {
      try {
        const newToken = await generateCsrfToken();
        setToken(newToken);
      } catch (error) {
        console.error('Failed to generate CSRF token:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    fetchToken();
  }, [onError]);

  // Render a hidden input field with the CSRF token
  return <input type="hidden" name="csrf_token" value={token} />;
}

/**
 * HOC to wrap a form component with CSRF protection
 * 
 * Example usage:
 * ```jsx
 * const MyProtectedForm = withCsrfProtection(MyForm);
 * ```
 */
export function withCsrfProtection<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    return (
      <>
        <Component {...props} />
        <CsrfToken />
      </>
    );
  };
}

/**
 * Create a form with built-in CSRF protection
 * 
 * Example usage:
 * ```jsx
 * <CsrfForm action={myServerAction}>
 *   <input type="text" name="username" />
 *   <button type="submit">Submit</button>
 * </CsrfForm>
 * ```
 */
export function CsrfForm({
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement> & { children: React.ReactNode }) {
  return (
    <form {...props}>
      <CsrfToken />
      {children}
    </form>
  );
} 