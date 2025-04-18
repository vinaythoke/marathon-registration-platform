import React from 'react';
import { Bell, Check, Info, Settings } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Notification, NotificationType } from '@/lib/services/notification-service';
import { Skeleton } from '@/components/ui/skeleton';

interface NotificationsPanelProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  loading?: boolean;
}

export default function NotificationsPanel({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  loading = false 
}: NotificationsPanelProps) {
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'error':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount} new</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            <Link href="/dashboard/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        <CardDescription>
          Stay updated on your events and registrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4 mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    flex items-start gap-3 p-3 rounded-lg
                    ${notification.read ? 'bg-background' : 'bg-muted'}
                    transition-colors
                  `}
                >
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 break-words">
                      {notification.message}
                    </p>
                    {notification.link && (
                      <Link href={notification.link} className="text-xs text-primary mt-2 block">
                        View details
                      </Link>
                    )}
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3 flex justify-between">
        <p className="text-xs text-muted-foreground">
          Notifications are updated in real-time
        </p>
        <Link href="/dashboard/notifications">
          <Button variant="link" size="sm" className="h-auto p-0">
            View all
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 