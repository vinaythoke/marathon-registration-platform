'use client';

import React from 'react';
import { NotificationsProvider, useNotifications } from './notifications-provider';
import NotificationsPanel from './notifications-panel';
import QuickActions from './quick-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BellRing, CalendarCheck, CalendarX } from 'lucide-react';
import UpcomingEventCard from './upcoming-event-card';
import PastEventCard from './past-event-card';
import NoEventsPlaceholder from './no-events-placeholder';
import { format } from 'date-fns';

interface RunnerDashboardClientProps {
  upcomingEvents: any[];
  pastEvents: any[];
  upcomingByMonth: Record<string, any[]>;
}

function DashboardContent() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      <div className="lg:col-span-2">
        <NotificationsPanel 
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      </div>
      <div className="lg:col-span-1">
        <QuickActions />
      </div>
    </div>
  );
}

export default function RunnerDashboardClient({ 
  upcomingEvents,
  pastEvents,
  upcomingByMonth
}: RunnerDashboardClientProps) {
  return (
    <NotificationsProvider>
      <DashboardContent />
      
      <Tabs defaultValue="upcoming" className="mt-8">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            <span>Upcoming Events ({upcomingEvents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <CalendarX className="h-4 w-4" />
            <span>Past Events ({pastEvents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellRing className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          {upcomingEvents.length === 0 ? (
            <NoEventsPlaceholder 
              title="No upcoming events"
              description="You haven't registered for any upcoming events yet."
              actionHref="/events"
              actionText="Explore Events"
            />
          ) : (
            <div className="space-y-8">
              {Object.entries(upcomingByMonth).map(([month, registrations]) => (
                <div key={month}>
                  <h3 className="font-medium text-lg mb-4">{month}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registrations.map((registration) => (
                      <UpcomingEventCard 
                        key={registration.id}
                        registration={registration}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="past">
          {pastEvents.length === 0 ? (
            <NoEventsPlaceholder 
              title="No past events"
              description="You haven't participated in any events yet."
              actionHref="/events"
              actionText="Explore Events"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((registration) => (
                <PastEventCard 
                  key={registration.id}
                  registration={registration}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="notifications">
          <div className="max-w-2xl mx-auto">
            <NotificationsTab />
          </div>
        </TabsContent>
      </Tabs>
    </NotificationsProvider>
  );
}

function NotificationsTab() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">All Notifications</h2>
        {notifications.some(n => !n.read) && (
          <button 
            onClick={markAllAsRead} 
            className="text-sm text-primary"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg border
                ${notification.read ? 'bg-background' : 'bg-muted'}
              `}
            >
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {format(notification.timestamp, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">{notification.message}</p>
                {notification.link && (
                  <a href={notification.link} className="text-sm text-primary mt-2 block">
                    View details
                  </a>
                )}
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-xs px-2 py-1 rounded bg-primary/10 text-primary"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 