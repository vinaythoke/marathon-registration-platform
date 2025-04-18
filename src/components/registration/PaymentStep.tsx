"use client";

import { useState, useEffect } from "react";
import { useRegistration } from "./RegistrationContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createPaymentOrder, PaymentData } from "@/lib/services/payment-service";
import { loadCashfree, initializeCashfreeCheckout } from "@/lib/clients/cashfree-client";

export default function PaymentStep() {
  const router = useRouter();
  const { 
    event, 
    selectedTicket, 
    registrationId, 
    setCurrentStep, 
    stepValidationErrors 
  } = useRegistration();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);

  useEffect(() => {
    const loadPaymentSDK = async () => {
      if (selectedTicket?.price > 0) {
        try {
          await loadCashfree();
          setCashfreeLoaded(true);
        } catch (error) {
          console.error("Failed to load Cashfree SDK:", error);
          setError("Failed to load payment provider. Please try again.");
        }
      } else {
        // Skip loading payment SDK for free tickets
        setCashfreeLoaded(true);
      }
    };

    loadPaymentSDK();
  }, [selectedTicket?.price]);

  // Show validation errors from context
  const currentErrors = stepValidationErrors['payment'] || [];

  if (!event || !selectedTicket || !registrationId) {
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

  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (selectedTicket.price === 0) {
        // For free tickets, directly proceed to confirmation
        router.push(`/events/${event.id}/register/confirmation?registrationId=${registrationId}`);
        return;
      }

      // Create a payment order
      const paymentData = await createPaymentOrder(registrationId);
      
      if (!paymentData.paymentSessionId) {
        throw new Error("Payment session creation failed");
      }
      
      initializeCashfreeCheckout({
        sessionId: paymentData.paymentSessionId,
        orderToken: paymentData.paymentSessionId, // Assuming sessionId contains the token
        container: document.getElementById("payment-form-container"),
        onSuccess: (data: any) => {
          console.log("Payment success", data);
          router.push(`/events/${event.id}/register/confirmation?registrationId=${registrationId}&orderId=${paymentData.orderId}`);
        },
        onFailure: (data: any) => {
          console.error("Payment failed", data);
          setError("Payment failed. Please try again.");
          setIsProcessing(false);
        },
        onClose: () => {
          console.log("Payment widget closed");
          setIsProcessing(false);
        },
        style: {
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          errorColor: "#ff0000",
          theme: "light"
        }
      });
      
    } catch (error: any) {
      console.error("Payment error:", error);
      setError(error.message || "Payment processing failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Display errors */}
      {(error || currentErrors.length > 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || currentErrors[0]}
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>
            Review your order and complete payment to finalize your registration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium">Event</h3>
            <p>{event.title}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(event.date).toLocaleDateString()}
            </p>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="font-medium">Ticket</h3>
            <div className="flex justify-between items-center">
              <p>{selectedTicket.name}</p>
              <p className="font-semibold">
                {selectedTicket.price === 0 
                  ? "Free" 
                  : formatCurrency(selectedTicket.price)
                }
              </p>
            </div>
            {selectedTicket.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTicket.description}
              </p>
            )}
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center font-semibold">
            <p>Total</p>
            <p>
              {selectedTicket.price === 0 
                ? "Free" 
                : formatCurrency(selectedTicket.price)
              }
            </p>
          </div>
          
          {/* Payment form container */}
          <div 
            id="payment-form-container"
            className={`mt-6 border rounded-md p-4 min-h-[200px] ${isProcessing ? 'bg-gray-50' : ''}`}
          >
            {!isProcessing && selectedTicket.price === 0 && (
              <div className="flex flex-col items-center justify-center space-y-4 py-10">
                <p className="text-center">No payment required for this free ticket.</p>
                <p className="text-sm text-muted-foreground text-center">
                  Click "Complete Registration" below to confirm your registration.
                </p>
              </div>
            )}
            
            {!isProcessing && selectedTicket.price > 0 && !cashfreeLoaded && (
              <div className="flex flex-col items-center justify-center space-y-4 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-center">Loading payment options...</p>
              </div>
            )}
            
            {!isProcessing && selectedTicket.price > 0 && cashfreeLoaded && (
              <div className="flex flex-col items-center justify-center space-y-4 py-10">
                <CreditCard className="h-12 w-12 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Ready to complete your registration</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click "Process Payment" below to proceed to the secure payment screen.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep('review')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          
          <Button 
            onClick={handlePayment}
            disabled={isProcessing || !cashfreeLoaded}
            className="gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              selectedTicket.price === 0 ? "Complete Registration" : "Process Payment"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 