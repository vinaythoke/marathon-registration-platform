import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import VolunteerDashboard from '@/components/volunteer/VolunteerDashboard';
import { getEvent } from '@/lib/services/event-service';
import DashboardSkeleton from '@/components/volunteer/DashboardSkeleton';

interface VolunteerPageProps {
  params: {
    eventId: string;
  };
}

export default async function VolunteerPage({ params }: VolunteerPageProps) {
  try {
    // Get the event details
    const event = await getEvent(params.eventId);
    
    if (!event) {
      return notFound();
    }
    
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">{event.title} - Volunteer Management</h1>
        <p className="text-muted-foreground mb-8">
          Manage volunteers, roles, and assignments for this event
        </p>
        
        <Suspense fallback={<DashboardSkeleton />}>
          <VolunteerDashboard eventId={params.eventId} />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error loading volunteer page:', error);
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Error Loading Volunteer Management</h1>
        <p className="text-muted-foreground">
          There was an error loading the volunteer management dashboard. Please try again later.
        </p>
      </div>
    );
  }
} 