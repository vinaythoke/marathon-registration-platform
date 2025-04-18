// Mock UI components for tests
import React from 'react';

export const DropdownMenu = ({ children }) => <div data-testid="dropdown-menu">{children}</div>;
export const DropdownMenuTrigger = ({ children }) => <div data-testid="dropdown-trigger">{children}</div>;
export const DropdownMenuContent = ({ children }) => <div data-testid="dropdown-content">{children}</div>;
export const DropdownMenuLabel = ({ children }) => <div data-testid="dropdown-label">{children}</div>;
export const DropdownMenuItem = ({ children, onSelect }) => (
  <div data-testid="dropdown-item" onClick={onSelect}>
    {children}
  </div>
);
export const DropdownMenuSeparator = () => <div data-testid="dropdown-separator" />;

export const Button = ({ children, className }) => <button className={className}>{children}</button>;

export const Badge = ({ children }) => <span data-testid="badge">{children}</span>;

// Export a fake Bell icon
export const Bell = () => <div data-testid="bell-icon"></div>;

// Export a fake formatDistanceToNow function
export const formatDistanceToNow = () => 'a few minutes ago'; 