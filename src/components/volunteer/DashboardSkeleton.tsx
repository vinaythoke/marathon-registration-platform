"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="roles" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
          <TabsTrigger value="volunteers" disabled>
            <Skeleton className="h-4 w-24" />
          </TabsTrigger>
          <TabsTrigger value="assignments" disabled>
            <Skeleton className="h-4 w-28" />
          </TabsTrigger>
          <TabsTrigger value="training" disabled>
            <Skeleton className="h-4 w-20" />
          </TabsTrigger>
        </TabsList>

        {/* Role Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-10 w-24" />
              </div>
              <div className="border rounded-md">
                <div className="p-4 border-b">
                  <div className="grid grid-cols-5 gap-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 border-b">
                    <div className="grid grid-cols-5 gap-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
} 