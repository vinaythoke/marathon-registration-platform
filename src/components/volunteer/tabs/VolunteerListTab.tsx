"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface VolunteerListTabProps {
  eventId: string;
}

export default function VolunteerListTab({ eventId }: VolunteerListTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer List</CardTitle>
        <CardDescription>
          View and manage volunteers for this event
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md">
            The volunteer list management feature is currently under development.
            Check back soon for the ability to view, add, and manage volunteers.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 