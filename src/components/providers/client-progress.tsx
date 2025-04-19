'use client';

import { useEffect } from 'react';
import NProgress from 'nprogress';

// Very simple client component that just initializes NProgress
export function ClientProgress() {
  useEffect(() => {
    // Initialize NProgress on mount
    NProgress.configure({ 
      showSpinner: false,
      minimum: 0.1,
      speed: 300
    });
    
    // Inject CSS manually instead of importing the CSS file
    const style = document.createElement('style');
    style.textContent = `
      /* Make clicks pass-through */
      #nprogress {
        pointer-events: none;
      }
      
      #nprogress .bar {
        background: #0070f3;
        position: fixed;
        z-index: 1031;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
      }
      
      /* Fancy blur effect */
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px #0070f3, 0 0 5px #0070f3;
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Clean up on unmount
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
  
  return null;
} 