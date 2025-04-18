"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, LayoutDashboard, FileEdit, AlertCircle, Settings, UsersRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [registrationCount, setRegistrationCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // Fetch user count
        const { count: userTotal, error: userError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        if (!userError) setUserCount(userTotal);
        
        // Fetch event count
        const { count: eventTotal, error: eventError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true });
        
        if (!eventError) setEventCount(eventTotal);
        
        // Fetch ticket count
        const { count: ticketTotal, error: ticketError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true });
        
        if (!ticketError) setTicketCount(ticketTotal);
        
        // Fetch registration count
        const { count: registrationTotal, error: registrationError } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true });
        
        if (!registrationError) setRegistrationCount(registrationTotal);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application with administrative tools
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Users" 
          value={userCount}
          icon={<UsersRound className="h-5 w-5 text-blue-600" />}
          loading={loading}
        />
        <StatCard 
          title="Events" 
          value={eventCount}
          icon={<FileEdit className="h-5 w-5 text-green-600" />}
          loading={loading}
        />
        <StatCard 
          title="Tickets" 
          value={ticketCount}
          icon={<AlertCircle className="h-5 w-5 text-amber-600" />}
          loading={loading}
        />
        <StatCard 
          title="Registrations" 
          value={registrationCount}
          icon={<Settings className="h-5 w-5 text-purple-600" />}
          loading={loading}
        />
      </div>

      {/* Quick Access Section */}
      <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <AdminAction
          title="Database Migrations"
          description="Run database migrations to update your schema"
          icon={<Database className="h-6 w-6" />}
          href="/admin/migrations"
        />
        <AdminAction
          title="User Management"
          description="Manage users, roles, and permissions"
          icon={<UsersRound className="h-6 w-6" />}
          href="/admin/users"
        />
        <AdminAction
          title="System Settings"
          description="Configure application settings"
          icon={<Settings className="h-6 w-6" />}
          href="/admin/settings"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatCard({ title, value, icon, loading = false }: StatCardProps) {
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
          ) : (
            value ?? 0
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AdminActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function AdminAction({ title, description, icon, href }: AdminActionProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <Link href={href} className="block h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {icon}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full justify-start">
            Access {title}
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
} 