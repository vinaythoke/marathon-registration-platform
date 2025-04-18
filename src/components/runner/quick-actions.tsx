import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  Search, 
  BarChart4 
} from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/profile" className="w-full">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1 p-0">
              <User className="h-5 w-5" />
              <span className="text-sm">Update Profile</span>
            </Button>
          </Link>
          
          <Link href="/events" className="w-full">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1 p-0">
              <Calendar className="h-5 w-5" />
              <span className="text-sm">Find Events</span>
            </Button>
          </Link>
          
          <Link href="/dashboard/runner/results" className="w-full">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1 p-0">
              <BarChart4 className="h-5 w-5" />
              <span className="text-sm">View Statistics</span>
            </Button>
          </Link>
          
          <Link href="/search" className="w-full">
            <Button variant="outline" className="w-full h-20 flex flex-col gap-1 p-0">
              <Search className="h-5 w-5" />
              <span className="text-sm">Search</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 