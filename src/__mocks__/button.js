// Mock for Button component
import React from 'react';

export const Button = ({ children, className, ...props }) => (
  <button className={className} {...props}>
    {children}
  </button>
); 