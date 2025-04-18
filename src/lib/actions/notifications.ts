'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { 
  NotificationType,
  createEventNotification
} from '@/lib/services/notification-service';

interface EventNotificationParams {
  eventId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

/**
 * Send a notification to all users registered for an event
 */
export async function sendEventNotification({
  eventId,
  title,
  message,
  type,
  link
}: EventNotificationParams): Promise<{ success: boolean; count: number }> {
  try {
    const notificationCount = await createEventNotification(eventId, {
      title,
      message,
      type,
      link: link || `/events/${eventId}`
    });
    
    revalidatePath('/dashboard/notifications');
    
    return {
      success: true,
      count: notificationCount
    };
  } catch (error) {
    console.error('Error sending event notification:', error);
    return {
      success: false,
      count: 0
    };
  }
}

/**
 * Send update notifications when an event is modified
 */
export async function sendEventUpdateNotification(
  eventId: string,
  changes: {
    dateChanged?: boolean;
    locationChanged?: boolean;
    titleChanged?: boolean;
    capacityChanged?: boolean;
  }
): Promise<{ success: boolean; count: number }> {
  try {
    // Get event details
    const supabase = createClient();
    const { data: event } = await supabase
      .from('events')
      .select('title')
      .eq('id', eventId)
      .single();
      
    if (!event) {
      return { success: false, count: 0 };
    }
    
    let title = 'Event Update';
    let message = `The "${event.title}" event has been updated.`;
    
    if (changes.dateChanged) {
      title = 'Event Date Changed';
      message = `The date for "${event.title}" has been updated. Please check the event details.`;
    } else if (changes.locationChanged) {
      title = 'Event Location Changed';
      message = `The location for "${event.title}" has been updated. Please check the event details.`;
    } else if (changes.titleChanged) {
      title = 'Event Renamed';
      message = `An event you registered for has been renamed to "${event.title}".`;
    } else if (changes.capacityChanged) {
      title = 'Event Capacity Changed';
      message = `The capacity for "${event.title}" has been updated.`;
    }
    
    return await sendEventNotification({
      eventId,
      title,
      message,
      type: 'info',
      link: `/events/${eventId}`
    });
  } catch (error) {
    console.error('Error sending event update notification:', error);
    return {
      success: false,
      count: 0
    };
  }
} 