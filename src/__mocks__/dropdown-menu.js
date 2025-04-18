// Mock for dropdown menu components
import React from 'react';

export const DropdownMenu = ({ children }) => <div data-testid="dropdown">{children}</div>;
export const DropdownMenuTrigger = ({ children }) => <div data-testid="dropdown-trigger">{children}</div>;
export const DropdownMenuContent = ({ children }) => <div data-testid="dropdown-content">{children}</div>;
export const DropdownMenuLabel = ({ children }) => <div data-testid="dropdown-label">{children}</div>;
export const DropdownMenuItem = ({ children, onSelect }) => (
  <div data-testid="dropdown-item" onClick={onSelect}>{children}</div>
);
export const DropdownMenuSeparator = () => <div data-testid="dropdown-separator" />; 