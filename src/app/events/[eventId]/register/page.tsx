"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRegistration, RegistrationProvider } from "@/components/registration/RegistrationContext";
import RegistrationProgress from "@/components/registration/RegistrationProgress";
import TicketSelection from "@/components/registration/TicketSelection";
import ReviewRegistration from "@/components/registration/ReviewRegistration";
import ConfirmationPage from "@/components/registration/ConfirmationPage";
import RegistrationForm from "@/components/registration/RegistrationForm";
import { fetchEventWithTickets } from "@/lib/actions/events";
import { getRunnerProfile } from "@/lib/actions/profile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

// Registration flow content selector
function RegistrationContent() {
  const { currentStep, event, isLoading } = useRegistration();
  
  // Show a loading state while data is being fetched
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading registration data...</p>
        </div>
      </div>
    );
  }

  // Show error if no event available
  if (!event) {
    return (
      <div className="flex justify-center p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Event information is not available. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Return the appropriate component based on the current step
  switch (currentStep) {
    case "select-ticket":
      return <TicketSelection />;
    case "registration-form":
      return <RegistrationForm formSchema={event.formSchema} />;
    case "review":
      return <ReviewRegistration />;
    case "confirmation":
      return <ConfirmationPage />;
    default:
      return <TicketSelection />;
  }
}

// Main registration page
export default function RegisterPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEventData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch the event data with tickets
        const eventData = await fetchEventWithTickets(eventId);
        if (!eventData) {
          setError("Event not found");
          return;
        }
        
        // Fetch the user's runner profile
        const profile = await getRunnerProfile();
        if (!profile) {
          setError("You need to complete your runner profile before registering");
          return;
        }
        
        setEvent(eventData);
      } catch (err) {
        setError("Failed to load registration data. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadEventData();
  }, [eventId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading event information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center p-6 min-h-[50vh] items-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Registration Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <RegistrationProvider initialEvent={event}>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Register for {event.title}</h1>
          <p className="text-muted-foreground mt-2">
            Follow the steps below to complete your registration
          </p>
        </div>
        
        <RegistrationProgress />
        
        <div className="mt-8">
          <RegistrationContent />
        </div>
      </div>
    </RegistrationProvider>
  );
} 