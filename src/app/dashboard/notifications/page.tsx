'use client';

import React from 'react';
import { Bell, Check, Info, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { Notification, NotificationType } from '@/lib/services/notification-service';
import { useNotifications } from '@/components/runner/notifications-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, loading, unreadCount } = useNotifications();
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);
  
  const renderNotificationList = (notificationList: Notification[]) => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="flex items-start gap-4 p-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }
    
    if (notificationList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No notifications</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {notificationList.map((notification) => (
          <Card key={notification.id} className={notification.read ? 'bg-card' : 'bg-muted'}>
            <div className="flex items-start gap-4 p-4">
              <div className="mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-muted-foreground mb-2">{notification.message}</p>
                <div className="flex items-center justify-between">
                  {notification.link && (
                    <Link href={notification.link}>
                      <Button variant="link" className="p-0 h-auto text-sm">
                        View details
                      </Button>
                    </Link>
                  )}
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <div className="bg-primary text-primary-foreground text-sm rounded-full px-2 py-0.5">
              {unreadCount}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>
      
      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && <span className="ml-2 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{unreadCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
        
        <TabsContent value="unread">
          {renderNotificationList(unreadNotifications)}
        </TabsContent>
        
        <TabsContent value="all">
          {renderNotificationList(notifications)}
        </TabsContent>
        
        <TabsContent value="read">
          {renderNotificationList(readNotifications)}
        </TabsContent>
      </Tabs>
    </div>
  );
} 