'use client';

// Extend the Window interface to include Cashfree
declare global {
  interface Window {
    Cashfree: any;
  }
}

/**
 * Load the Cashfree JS SDK
 */
export async function loadCashfree(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if Cashfree is already loaded
    if (typeof window.Cashfree !== 'undefined') {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.prod.js';
    script.async = true;
    script.defer = true;

    // Set up event listeners
    script.onload = () => {
      if (typeof window.Cashfree !== 'undefined') {
        resolve();
      } else {
        reject(new Error('Cashfree SDK failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Cashfree SDK'));
    };

    // Append script to document
    document.head.appendChild(script);
  });
}

/**
 * Initialize Cashfree checkout
 */
export interface CashfreeInitOptions {
  sessionId: string;
  orderToken: string;
  container: HTMLElement | null;
  onSuccess: (data: any) => void;
  onFailure: (data: any) => void;
  onClose?: () => void;
  style?: {
    backgroundColor?: string;
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    errorColor?: string;
    theme?: 'light' | 'dark';
  };
}

export function initializeCashfreeCheckout(options: CashfreeInitOptions): void {
  if (typeof window.Cashfree === 'undefined') {
    throw new Error('Cashfree SDK not loaded');
  }

  if (!options.container) {
    throw new Error('Container element not found');
  }

  const cashfree = new window.Cashfree();
  cashfree.initialiseDropin({
    ...options
  });
} 