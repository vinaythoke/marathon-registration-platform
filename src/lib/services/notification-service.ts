import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetches all notifications for the current user
 */
export async function fetchUserNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data as Notification[];
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId);
    
  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
  
  return true;
}

/**
 * Marks all notifications for the current user as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('read', false);
    
  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
  
  return true;
}

/**
 * Creates a new notification for a user
 */
export async function createNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
  }
): Promise<Notification | null> {
  const supabase = createClient();
  
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      read: false
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating notification:', error);
    return null;
  }
  
  return notification as Notification;
}

/**
 * Creates a notification for a specific event and sends it to all registered users
 */
export async function createEventNotification(
  eventId: string,
  data: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
  }
): Promise<number> {
  const supabase = createClient();
  
  // Get all users registered for this event
  const { data: registrations, error: registrationsError } = await supabase
    .from('registrations')
    .select('user_id')
    .eq('event_id', eventId)
    .eq('status', 'confirmed');
    
  if (registrationsError) {
    console.error('Error fetching registrations:', registrationsError);
    return 0;
  }
  
  if (!registrations.length) {
    return 0;
  }
  
  // Create a notification for each registered user
  const userIds = Array.from(new Set(registrations.map(r => r.user_id)));
  const notificationsToInsert = userIds.map(userId => ({
    user_id: userId,
    title: data.title,
    message: data.message,
    type: data.type,
    link: data.link,
    read: false
  }));
  
  const { error } = await supabase
    .from('notifications')
    .insert(notificationsToInsert);
    
  if (error) {
    console.error('Error creating event notifications:', error);
    return 0;
  }
  
  return userIds.length;
} 