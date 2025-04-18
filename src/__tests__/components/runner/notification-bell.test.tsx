import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationBell } from '@/components/runner/notification-bell';
import { useNotifications } from '@/components/runner/notifications-provider';

// Mock the useNotifications hook
jest.mock('@/components/runner/notifications-provider', () => ({
  useNotifications: jest.fn()
}));

// Mock third-party modules
jest.mock('next/link', () => {
  return ({ children }) => <div>{children}</div>;
});

jest.mock('lucide-react', () => ({
  Bell: () => <div data-testid="bell-icon" />
}));

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn().mockReturnValue('5 minutes ago')
}));

describe('NotificationBell Component', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'New Event',
      message: 'A new marathon has been added',
      created_at: new Date().toISOString(),
      read: false,
      link: '/events/123'
    }
  ];

  beforeEach(() => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1,
      markAsRead: jest.fn()
    });
  });

  test('renders the notification bell icon', () => {
    render(<NotificationBell />);
    const bellIcon = screen.getByTestId('bell-icon');
    expect(bellIcon).toBeInTheDocument();
  });

  test('displays the notification count badge when there are unread notifications', () => {
    render(<NotificationBell />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
}); 