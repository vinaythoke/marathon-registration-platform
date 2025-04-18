"use client";

import { useState, useEffect } from 'react';
import { useRegistration } from './RegistrationContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createRegistration } from '@/lib/actions/registration';
import { TicketWithAvailability } from '@/types/registration';
import { Badge } from '@/components/ui/badge';

export default function TicketSelection() {
  const { 
    tickets, 
    event, 
    selectedTicket, 
    setSelectedTicket, 
    goToNextStep,
    stepValidationErrors,
    validateCurrentStep,
    registrationId, 
    setRegistrationId 
  } = useRegistration();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if all tickets are sold out
  const allTicketsSoldOut = tickets.every(ticket => ticket.available_quantity <= 0);
  
  // Handle ticket selection
  const handleTicketSelect = (ticket: TicketWithAvailability) => {
    setSelectedTicket(ticket);
    setError(null); // Clear any previous errors
  };
  
  // Handle submit action - create registration record in database
  const handleSubmit = async () => {
    // Validate before submission
    if (!validateCurrentStep()) {
      return;
    }
    
    if (!event || !selectedTicket) {
      setError('Please select a ticket to continue.');
      return;
    }
    
    // If we already have a registration ID, just move to the next step
    if (registrationId) {
      goToNextStep();
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Call server action to create a registration
      const result = await createRegistration(event.id, selectedTicket.id);
      
      // Save the registration ID
      setRegistrationId(result.registrationId);
      
      // Move to the next step
      goToNextStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create registration.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Display validation errors
  const currentErrors = stepValidationErrors['select-ticket'] || [];
  
  return (
    <div className="space-y-6">
      {/* Display errors from validation or API */}
      {(error || currentErrors.length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || currentErrors[0]}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Sold out message */}
      {allTicketsSoldOut ? (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All tickets for this event are currently sold out.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Select Ticket</CardTitle>
            <CardDescription>
              Choose a ticket type for {event?.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedTicket?.id} 
              onValueChange={(value) => {
                const ticket = tickets.find(t => t.id === value);
                if (ticket) {
                  handleTicketSelect(ticket);
                }
              }}
              className="flex flex-col space-y-4"
            >
              {tickets.map((ticket) => {
                const isSoldOut = ticket.available_quantity <= 0;
                const isSelected = selectedTicket?.id === ticket.id;
                
                return (
                  <div 
                    key={ticket.id} 
                    className={cn(
                      "flex items-start space-x-3 rounded-lg border p-4 transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border",
                      isSoldOut ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                    onClick={() => !isSoldOut && handleTicketSelect(ticket)}
                  >
                    <RadioGroupItem 
                      value={ticket.id} 
                      id={ticket.id}
                      disabled={isSoldOut}
                      className="mt-1"
                    />
                    <div className="flex flex-col space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={ticket.id} className="font-medium cursor-pointer">
                          {ticket.name}
                        </Label>
                        <div className="flex items-center space-x-2">
                          {isSoldOut ? (
                            <Badge variant="outline" className="text-destructive">Sold Out</Badge>
                          ) : (
                            <Badge variant="outline">
                              {ticket.available_quantity} left
                            </Badge>
                          )}
                          <span className="font-medium">
                            {ticket.price === 0 ? 'Free' : formatCurrency(ticket.price)}
                          </span>
                        </div>
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      )}
                      {ticket.features && ticket.features.length > 0 && (
                        <ul className="text-sm mt-2 space-y-1">
                          {ticket.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 text-primary/70" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedTicket || isSubmitting || allTicketsSoldOut}
              className="gap-2"
            >
              {isSubmitting ? 'Processing...' : 'Continue'} 
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 