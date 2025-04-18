"use client";

import { useRegistration } from "./RegistrationContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Download, Calendar, Mail } from "lucide-react";
import Link from "next/link";

export default function ConfirmationStep() {
  const { event, selectedTicket, registrationId, resetRegistration } = useRegistration();

  if (!event || !selectedTicket || !registrationId) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground">Registration information is missing.</p>
        <Button 
          variant="outline" 
          onClick={resetRegistration}
          className="mt-4"
        >
          Start Over
        </Button>
      </div>
    );
  }
  
  const eventDate = new Date(event.date);

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-8">
      <div className="flex flex-col items-center text-center space-y-2 mb-8">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold">Registration Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for registering for {event.title}. Your spot has been secured.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Mark your calendar for this exciting event!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-primary h-5 w-5" />
            <div>
              <p className="font-semibold">{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-sm text-muted-foreground">Event Date</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium">Location</h3>
            <p>{event.location}</p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium">Ticket Information</h3>
            <p>{selectedTicket.name}</p>
            <p className="text-sm text-muted-foreground">Registration ID: {registrationId}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 sm:flex-row">
          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/dashboard/tickets">
              <Calendar className="h-4 w-4" />
              View My Tickets
            </Link>
          </Button>
          <Button className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Ticket
          </Button>
        </CardFooter>
      </Card>
      
      <div className="bg-muted/50 rounded-lg p-4 border">
        <div className="flex gap-3 items-start">
          <Mail className="h-6 w-6 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-medium mb-1">Confirmation Email Sent</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation email with all the details. If you don't see it in your inbox, 
              please check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center pt-6">
        <Button 
          variant="outline" 
          className="gap-2"
          onClick={resetRegistration}
          asChild
        >
          <Link href="/events">
            Browse More Events
          </Link>
        </Button>
      </div>
    </div>
  );
} 