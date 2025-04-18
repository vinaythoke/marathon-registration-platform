"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import StatisticsTab from "@/components/runner/statistics-tab";
import { Card, CardContent } from "@/components/ui/card";

export default function RunnerStatisticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("Authentication required. Please sign in to view your statistics.");
          return;
        }
        
        setUserId(user.id);
      } catch (err) {
        console.error("Error checking authentication:", err);
        setError("Failed to load your statistics. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    checkAuth();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading your statistics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Running Statistics</h1>
        <p className="text-muted-foreground">
          Track your performance, achievements, and progress over time
        </p>
      </div>

      {userId && <StatisticsTab userId={userId} />}
    </div>
  );
} 