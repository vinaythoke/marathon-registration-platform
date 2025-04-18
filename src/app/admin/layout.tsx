"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Database,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  UserCog,
} from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const supabase = createClient();
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("Authentication error:", userError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        // Check if the user is an admin
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (profileError) {
          console.error("Profile error:", profileError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        setIsAdmin(profile?.role === "admin");
      } catch (error) {
        console.error("Admin check error:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAdminStatus();
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (isAdmin === false) {
      router.push("/");
    }
  }, [isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access the admin area.
          </p>
          <Button asChild>
            <Link href="/">Return to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r hidden md:block p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5" />
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricted Access Area
          </p>
        </div>

        <nav className="space-y-1">
          <SidebarLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />}>
            Dashboard
          </SidebarLink>
          <SidebarLink href="/admin/migrations" icon={<Database className="h-4 w-4" />}>
            Migrations
          </SidebarLink>
          <SidebarLink href="/admin/users" icon={<UserCog className="h-4 w-4" />}>
            User Management
          </SidebarLink>
          <SidebarLink href="/admin/settings" icon={<Settings className="h-4 w-4" />}>
            Settings
          </SidebarLink>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-background border-b flex items-center md:hidden">
          <h1 className="text-xl font-bold flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5" />
            Admin Panel
          </h1>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>

        <footer className="p-4 border-t text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            Admin access only. All actions are logged.
          </div>
        </footer>
      </div>
    </div>
  );
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  const isActive = typeof window !== 'undefined' ? window.location.pathname === href : false;

  return (
    <Link
      href={href}
      className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="mr-3">{icon}</span>
      {children}
    </Link>
  );
} 