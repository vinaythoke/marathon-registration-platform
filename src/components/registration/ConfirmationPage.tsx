"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRegistration } from "./RegistrationContext";
import { CheckCircle2, ChevronRight, HomeIcon, Ticket, QrCode, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import { createDigitalTicket, getTicketById } from "@/lib/services/ticket-service";
import DigitalTicket from "@/components/tickets/DigitalTicket";
import { DigitalTicket as DigitalTicketType } from "@/components/tickets/types";

export default function ConfirmationPage() {
  const { event, selectedTicket, registrationId, userId, resetRegistration } = useRegistration();
  const [ticket, setTicket] = useState<DigitalTicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateTicket() {
      if (!event || !selectedTicket || !registrationId || !userId) {
        setError("Missing registration information");
        setLoading(false);
        return;
      }

      try {
        // First try to create the digital ticket
        const qrCodeData = await createDigitalTicket(
          userId, 
          event.id, 
          selectedTicket.id,
          registrationId
        );

        if (!qrCodeData) {
          setError("Failed to generate ticket");
          setLoading(false);
          return;
        }

        // Then fetch the complete ticket data
        const ticketData = await getTicketById(registrationId);
        setTicket(ticketData);
      } catch (err) {
        console.error("Error generating ticket:", err);
        setError("An error occurred while generating your ticket");
      } finally {
        setLoading(false);
      }
    }

    generateTicket();
  }, [event, selectedTicket, registrationId, userId]);

  if (!event || !selectedTicket || !registrationId) {
    return (
      <div className="flex justify-center p-6">
        <Alert variant="destructive">
          <AlertTitle>Registration Error</AlertTitle>
          <AlertDescription>
            We couldn't find your registration information. Please try registering again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Registration Confirmed!</h1>
          <p className="text-muted-foreground">
            Your registration for {event.title} has been successfully completed.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
          <CardDescription>Your registration has been confirmed with the following details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Registration ID</h3>
            <p className="font-mono">{registrationId}</p>
          </div>
          <div>
            <h3 className="font-medium">Event</h3>
            <p>{event.title}</p>
          </div>
          <div>
            <h3 className="font-medium">Date</h3>
            <p>{new Date(event.date).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="font-medium">Ticket</h3>
            <p>{selectedTicket.name} - {formatCurrency(selectedTicket.price)}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to your registered email address with all the details.
          </p>
          <p className="text-sm text-muted-foreground">
            You can view your registration details and download your ticket from your dashboard.
          </p>
        </CardFooter>
      </Card>

      {/* Digital Ticket Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Ticket className="mr-2 h-5 w-5" />
            Your Digital Ticket
          </CardTitle>
          <CardDescription>
            Use this ticket for entry to the event or to collect your race materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-pulse text-center">
                <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Generating your ticket...</p>
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Ticket Error</AlertTitle>
              <AlertDescription>
                {error}. You can still access your ticket from your dashboard later.
              </AlertDescription>
            </Alert>
          ) : ticket ? (
            <DigitalTicket 
              ticket={ticket} 
              onDownload={() => console.log("Download functionality to be implemented")}
              onShare={() => console.log("Share functionality to be implemented")}
            />
          ) : (
            <Alert>
              <AlertTitle>Ticket Not Available</AlertTitle>
              <AlertDescription>
                Your ticket will be available in your dashboard soon.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild>
            <Link href="/dashboard/tickets" className="flex items-center gap-2">
              <span>View All Tickets</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          variant="outline"
          asChild
          className="flex items-center gap-2"
        >
          <Link href="/dashboard">
            <HomeIcon className="h-4 w-4" /> My Dashboard
          </Link>
        </Button>
        
        <Button 
          onClick={resetRegistration}
          className="flex items-center gap-2"
        >
          Register for Another Event <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}