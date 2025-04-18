"use client";

import { useRegistration } from "./RegistrationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function ReviewRegistration() {
  const { 
    event, 
    selectedTicket, 
    formData,
    setCurrentStep, 
    validateCurrentStep
  } = useRegistration();

  if (!event || !selectedTicket) {
    return (
      <div className="flex justify-center p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing information</AlertTitle>
          <AlertDescription>
            Required information is missing. Please go back and complete the previous steps.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleContinue = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep('payment');
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Review Registration</h2>
        <p className="text-muted-foreground">Please review your information before proceeding to payment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Information about the event you're registering for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Event</h3>
            <p>{event.title}</p>
          </div>
          <div>
            <h3 className="font-medium">Date</h3>
            <p>{new Date(event.date).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="font-medium">Location</h3>
            <p>{event.location}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Selection</CardTitle>
          <CardDescription>Your selected ticket details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Ticket Type</h3>
            <p>{selectedTicket.name}</p>
          </div>
          <div>
            <h3 className="font-medium">Price</h3>
            <p className="text-lg font-semibold">
              {selectedTicket.price === 0 
                ? "Free" 
                : formatCurrency(selectedTicket.price)
              }
            </p>
          </div>
          {selectedTicket.description && (
            <div>
              <h3 className="font-medium">Description</h3>
              <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(formData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Registration Information</CardTitle>
            <CardDescription>Your provided registration details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <h3 className="font-medium capitalize">{key.replace(/_/g, ' ')}</h3>
                  <p>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                  <Separator className="mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('registration-form')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        <Button 
          onClick={handleContinue}
          className="gap-2"
        >
          {selectedTicket.price === 0 ? "Complete Registration" : "Proceed to Payment"} <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 