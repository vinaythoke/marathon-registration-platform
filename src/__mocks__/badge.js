// Mock for Badge component
import React from 'react';

export const Badge = ({ children, className, ...props }) => (
  <span data-testid="badge" className={className} {...props}>
    {children}
  </span>
); 