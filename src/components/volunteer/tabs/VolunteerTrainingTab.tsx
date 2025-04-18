"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface VolunteerTrainingTabProps {
  eventId: string;
}

export default function VolunteerTrainingTab({ eventId }: VolunteerTrainingTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer Training</CardTitle>
        <CardDescription>
          Manage training materials and track completion status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
          <p className="text-muted-foreground max-w-md">
            The volunteer training management feature is currently under development.
            Check back soon for the ability to upload training materials and track completion.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 