"use client";

import { useEffect, useState } from "react";
import { getUserTickets } from "@/lib/services/ticket-service";
import { DigitalTicket } from "@/components/tickets/types";
import TicketList from "@/components/tickets/TicketList";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, RefreshCw, Ticket } from "lucide-react";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<DigitalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Authentication required. Please sign in to view your tickets.");
        setLoading(false);
        return;
      }
      
      // Fetch tickets for the user
      const userTickets = await getUserTickets(user.id);
      setTickets(userTickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to load tickets. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Ticket className="mr-2 h-6 w-6" />
            My Tickets
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your event tickets
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={loading || refreshing}
            className="flex items-center"
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading your tickets...</p>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="my-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <TicketList tickets={tickets} />
      )}
    </div>
  );
} 