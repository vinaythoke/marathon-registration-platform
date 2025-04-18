"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TicketValidator from "@/components/tickets/TicketValidator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { Loader2, QrCode, Shield } from "lucide-react";

export default function TicketValidationPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // Check if user is authorized (is an organizer)
  useEffect(() => {
    async function checkAuthorization() {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError("You must be logged in to access this page");
          setLoading(false);
          return;
        }
        
        // 2. Check if user is an organizer for this event
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (!profile || profile.role !== 'organizer') {
          setError("You must be an organizer to access this page");
          setLoading(false);
          return;
        }
        
        // 3. Check if event exists and user is organizer for it
        const { data: event } = await supabase
          .from('events')
          .select('title')
          .eq('id', eventId)
          .single();
        
        if (!event) {
          setError("Event not found");
          setLoading(false);
          return;
        }
        
        // Set event information and authorization status
        setEventName(event.title);
        setIsOrganizer(true);
        
      } catch (err) {
        console.error("Error checking authorization:", err);
        setError("An error occurred while verifying your permissions");
      } finally {
        setLoading(false);
      }
    }

    checkAuthorization();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Verifying your permissions...</p>
        </div>
      </div>
    );
  }

  if (error || !isOrganizer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            {error || "You do not have permission to access this page"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center">
          <Shield className="mr-2 h-7 w-7" />
          Ticket Validation
        </h1>
        <p className="text-muted-foreground mt-1">
          Validate tickets for {eventName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <TicketValidator 
            onValidate={(ticket) => {
              console.log("Ticket validated:", ticket);
              // Here you could log the validation, update the database, etc.
            }}
          />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Instructions
              </CardTitle>
              <CardDescription>
                How to validate event tickets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">1. Scan the QR code</h3>
                <p className="text-sm text-muted-foreground">Ask the runner to show their digital ticket and scan the QR code.</p>
              </div>
              <div>
                <h3 className="font-medium">2. Verify ticket details</h3>
                <p className="text-sm text-muted-foreground">Check that the runner's name matches their ID and that the event details are correct.</p>
              </div>
              <div>
                <h3 className="font-medium">3. Distribute race materials</h3>
                <p className="text-sm text-muted-foreground">Provide the runner with their race packet, bib number, and any other race materials.</p>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Note: Each ticket can only be used once. The system will alert you if someone tries to use a ticket that's already been validated.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}