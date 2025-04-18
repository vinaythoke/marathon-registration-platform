"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, UserCheck, UserX } from "lucide-react";
import { VolunteerAssignment } from "@/types/volunteer";

interface VolunteerCheckInStatusProps {
  eventId: string;
  assignments: VolunteerAssignment[];
}

export default function VolunteerCheckInStatus({
  eventId,
  assignments,
}: VolunteerCheckInStatusProps) {
  // Calculate statistics
  const totalVolunteers = assignments.length;
  const checkedInCount = assignments.filter(a => a.check_in_time && !a.check_out_time).length;
  const completedCount = assignments.filter(a => a.check_out_time).length;
  const pendingCount = totalVolunteers - checkedInCount - completedCount;
  
  // Calculate progress percentage
  const progressPercentage = totalVolunteers > 0 
    ? ((checkedInCount + completedCount) / totalVolunteers) * 100 
    : 0;

  // Group assignments by role
  const assignmentsByRole = assignments.reduce((acc, assignment) => {
    const roleName = assignment.role?.name || 'Unknown';
    if (!acc[roleName]) {
      acc[roleName] = {
        total: 0,
        checkedIn: 0,
        completed: 0,
        required: assignment.role?.required_volunteers || 0,
        location: assignment.role?.location || 'N/A',
      };
    }
    
    acc[roleName].total += 1;
    
    if (assignment.check_in_time && !assignment.check_out_time) {
      acc[roleName].checkedIn += 1;
    } else if (assignment.check_out_time) {
      acc[roleName].completed += 1;
    }
    
    return acc;
  }, {} as Record<string, { total: number; checkedIn: number; completed: number; required: number; location: string }>);

  // Get recently checked-in volunteers (last 5)
  const recentlyCheckedIn = [...assignments]
    .filter(a => a.check_in_time)
    .sort((a, b) => {
      const timeA = a.check_in_time ? new Date(a.check_in_time).getTime() : 0;
      const timeB = b.check_in_time ? new Date(b.check_in_time).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volunteer Check-In Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Check-in Progress</span>
            <span className="text-sm text-muted-foreground">
              {checkedInCount + completedCount} / {totalVolunteers} volunteers
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 w-full" />
          
          <div className="flex justify-between text-sm pt-2">
            <div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" /> {checkedInCount} Active
              </Badge>
            </div>
            <div>
              <Badge variant="outline" className="bg-gray-100">
                <Clock className="w-3 h-3 mr-1" /> {completedCount} Completed
              </Badge>
            </div>
            <div>
              <Badge variant="outline">
                {pendingCount} Pending
              </Badge>
            </div>
          </div>
        </div>

        {/* Role Status */}
        <div>
          <h3 className="text-sm font-medium mb-2">Role Coverage</h3>
          <div className="space-y-4">
            {Object.entries(assignmentsByRole).map(([roleName, stats]) => (
              <div key={roleName} className="border rounded-md p-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{roleName}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.checkedIn + stats.completed} / {stats.required} required
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Location: {stats.location}
                </div>
                <Progress 
                  value={(stats.checkedIn + stats.completed) / stats.required * 100} 
                  className="h-1.5 w-full"
                  // If we've met or exceeded the required number, show green
                  indicatorColor={stats.checkedIn + stats.completed >= stats.required ? 'bg-green-500' : undefined}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentlyCheckedIn.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Recent Check-ins</h3>
            <div className="space-y-2">
              {recentlyCheckedIn.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span>{assignment.volunteer?.profile.name}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {assignment.role?.name} • {assignment.check_in_time && new Date(assignment.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 