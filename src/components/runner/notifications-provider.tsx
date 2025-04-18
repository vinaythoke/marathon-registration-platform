'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  Notification, 
  fetchUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead as markAllAsReadService
} from '@/lib/services/notification-service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  loading: boolean;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    
    if (success) {
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    }
  };

  const markAllAsRead = async () => {
    const success = await markAllAsReadService();
    
    if (success) {
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      toast({
        description: 'All notifications marked as read',
      });
    }
  };

  // Fetch initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const data = await fetchUserNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchUserNotifications().then(data => setNotifications(data));
      } else if (event === 'SIGNED_OUT') {
        setNotifications([]);
      }
    });

    const setupRealTimeUpdates = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      // Subscribe to notifications table for changes
      const channel = supabase
        .channel('notifications_changes')
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          }, 
          (payload) => {
            // Add new notification to state
            const newNotification = payload.new as Notification;
            
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast for the new notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
            });
          })
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            // Update existing notification in state
            const updatedNotification = payload.new as Notification;
            
            setNotifications(prev => 
              prev.map(notification => 
                notification.id === updatedNotification.id
                  ? updatedNotification
                  : notification
              )
            );
          })
        .subscribe();
      
      return () => {
        channel.unsubscribe();
      };
    };

    const cleanup = setupRealTimeUpdates();
    
    return () => {
      authListener.subscription.unsubscribe();
      if (cleanup) {
        cleanup.then(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
      }
    };
  }, [supabase, toast]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}>
      {children}
    </NotificationsContext.Provider>
  );
} 