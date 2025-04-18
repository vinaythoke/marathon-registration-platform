"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getVolunteerDashboardStats,
  getVolunteerRoles,
  getVolunteerAssignments,
} from "@/lib/services/volunteer-service";
import { VolunteerDashboardStats, VolunteerRole, VolunteerAssignment } from "@/types/volunteer";
import { Users, ClipboardList, UserCheck, Award, Package, QrCode } from "lucide-react";
import VolunteerRolesTab from "./tabs/VolunteerRolesTab";
import VolunteerListTab from "./tabs/VolunteerListTab";
import VolunteerAssignmentsTab from "./tabs/VolunteerAssignmentsTab";
import VolunteerTrainingTab from "./tabs/VolunteerTrainingTab";
import KitDistributionTab from "./tabs/KitDistributionTab";
import TicketVerificationTab from "./tabs/TicketVerificationTab";
import VolunteerCheckInStatus from "./VolunteerCheckInStatus";
import { useVolunteerRealTimeUpdates } from '@/hooks/useVolunteerRealTimeUpdates';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VolunteerDashboardProps {
  eventId: string;
}

export default function VolunteerDashboard({
  eventId,
}: VolunteerDashboardProps) {
  const [stats, setStats] = useState<VolunteerDashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState("roles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  // Set up real-time updates for volunteer assignments
  const { isSubscribed, error: subscriptionError } = useVolunteerRealTimeUpdates(
    eventId,
    (updatedAssignments) => {
      setAssignments(updatedAssignments);
      
      // Refresh stats when assignments change
      async function refreshStats() {
        try {
          const dashboardStats = await getVolunteerDashboardStats(eventId);
          setStats(dashboardStats);
        } catch (err) {
          console.error('Error refreshing dashboard stats:', err);
        }
      }
      
      refreshStats();
    }
  );

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const dashboardStats = await getVolunteerDashboardStats(eventId);
        setStats(dashboardStats);
        setError(null);
      } catch (err: any) {
        console.error("Error loading dashboard stats:", err);
        setError(err.message || "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [eventId]);

  // Load volunteer assignments when the assignments tab is active
  useEffect(() => {
    async function loadAssignments() {
      if (activeTab === "assignments" && assignments.length === 0) {
        try {
          setAssignmentsLoading(true);
          const data = await getVolunteerAssignments(eventId);
          setAssignments(data);
        } catch (err: any) {
          console.error("Error loading volunteer assignments:", err);
        } finally {
          setAssignmentsLoading(false);
        }
      }
    }

    loadAssignments();
  }, [activeTab, eventId, assignments.length]);

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      {activeTab === "assignments" && (
        <>
          {subscriptionError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to subscribe to real-time updates: {subscriptionError}
              </AlertDescription>
            </Alert>
          )}
          {isSubscribed && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-1 rounded flex items-center mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Real-time updates active
            </div>
          )}
        </>
      )}
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Volunteers"
          value={stats?.total_volunteers || 0}
          description="Volunteers assigned to roles"
          icon={<Users className="h-4 w-4 text-blue-600" />}
          loading={loading}
        />
        <StatsCard
          title="Volunteer Roles"
          value={stats?.active_roles || 0}
          total={stats?.total_roles || 0}
          description={`${stats?.filled_roles || 0} roles filled`}
          icon={<ClipboardList className="h-4 w-4 text-green-600" />}
          loading={loading}
        />
        <StatsCard
          title="Checked-in"
          value={stats?.checked_in_volunteers || 0}
          description="Volunteers present"
          icon={<UserCheck className="h-4 w-4 text-amber-600" />}
          loading={loading}
        />
        <StatsCard
          title="Kits Distributed"
          value={stats?.kits_distributed || 0}
          description="Race kits given to participants"
          icon={<Award className="h-4 w-4 text-purple-600" />}
          loading={loading}
        />
      </div>

      {/* Dashboard Tabs */}
      <Tabs
        defaultValue="roles"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="roles">Volunteer Roles</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteer List</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="verification">Ticket Verification</TabsTrigger>
          <TabsTrigger value="kits">Kit Distribution</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <VolunteerRolesTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="volunteers">
          <VolunteerListTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="assignments">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <VolunteerAssignmentsTab 
                eventId={eventId} 
                isLoading={assignmentsLoading}
                assignments={assignments}
                setAssignments={setAssignments}
              />
            </div>
            {!assignmentsLoading && assignments.length > 0 && (
              <div className="hidden md:block md:col-span-2 lg:col-span-1">
                <VolunteerCheckInStatus eventId={eventId} assignments={assignments} />
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="verification">
          <TicketVerificationTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="kits">
          <KitDistributionTab eventId={eventId} />
        </TabsContent>

        <TabsContent value="training">
          <VolunteerTrainingTab eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  total?: number;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatsCard({
  title,
  value,
  total,
  description,
  icon,
  loading = false,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <span className="animate-pulse">...</span>
          ) : total ? (
            `${value}/${total}`
          ) : (
            value
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
} 