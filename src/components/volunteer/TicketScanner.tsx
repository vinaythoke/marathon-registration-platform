"use client";

import { useState, useEffect } from "react";
import { verifyTicket, recordTicketVerification } from "@/lib/services/ticket-service";
import QRCodeScanner from "./QRCodeScanner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, XCircle, QrCode, User } from "lucide-react";
import { DigitalTicket } from "@/components/tickets/types";
import { createClient } from "@/lib/supabase/client";

interface TicketScannerProps {
  eventId: string;
  onSuccessfulVerification?: (ticket: DigitalTicket) => void;
}

export default function TicketScanner({ eventId, onSuccessfulVerification }: TicketScannerProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState<string>("");
  const [verifiedTicket, setVerifiedTicket] = useState<DigitalTicket | null>(null);
  const [manualQrData, setManualQrData] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showScanner, setShowScanner] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user ID on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    
    fetchUser();
  }, []);

  // Handle QR code scanning
  const handleScan = async (data: string) => {
    try {
      setIsVerifying(true);
      setScanMessage("Verifying ticket...");
      setScanSuccess(false);
      setVerifiedTicket(null);
      
      // Call the verification service
      const result = await verifyTicket(data);
      
      if (result.valid && result.ticketData) {
        // Verify this ticket is for the current event
        if (result.ticketData.event_id !== eventId) {
          setScanMessage(`Invalid ticket: This ticket is for a different event`);
          setIsVerifying(false);
          return;
        }
        
        // Successfully verified
        setVerifiedTicket(result.ticketData);
        setScanMessage(`Ticket verified for ${result.ticketData.runner_name}`);
        setScanSuccess(true);
        
        // Record the verification if we have a user ID
        if (userId) {
          await recordTicketVerification(
            result.ticketData.id,
            userId,
            'verified'
          );
        }
        
        // Call the success callback if provided
        if (onSuccessfulVerification) {
          onSuccessfulVerification(result.ticketData);
        }
      } else {
        // Verification failed
        setScanMessage(`Verification failed: ${result.message}`);
      }
    } catch (err: any) {
      console.error("Error verifying ticket:", err);
      setScanMessage(`Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle error during scanning
  const handleScanError = (error: string) => {
    setScanMessage(`Scanning error: ${error}`);
    setScanSuccess(false);
  };

  // Handle manual verification
  const handleManualVerify = async () => {
    if (!manualQrData) return;
    await handleScan(manualQrData);
  };

  // Handle rejection of a ticket
  const handleReject = async () => {
    if (!verifiedTicket || !userId) return;
    
    try {
      setIsVerifying(true);
      
      // Record the rejection
      await recordTicketVerification(
        verifiedTicket.id,
        userId,
        'rejected',
        notes
      );
      
      // Update UI
      setScanMessage("Ticket has been rejected");
      setVerifiedTicket(null);
      setNotes("");
    } catch (err: any) {
      console.error("Error rejecting ticket:", err);
      setScanMessage(`Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Reset the scanner to scan again
  const handleReset = () => {
    setScanSuccess(false);
    setVerifiedTicket(null);
    setScanMessage("");
    setManualQrData("");
    setNotes("");
    setShowScanner(true);
  };

  return (
    <div className="space-y-6">
      {/* Ticket Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="mr-2 h-5 w-5" />
            Ticket Scanner
          </CardTitle>
          <CardDescription>
            Scan runner tickets to verify participation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showScanner && !verifiedTicket ? (
            <div className="space-y-4">
              <QRCodeScanner onScan={handleScan} onError={handleScanError} />
              
              <div className="mt-4 flex flex-col space-y-4">
                <p className="text-sm text-muted-foreground">
                  Or enter QR code data manually:
                </p>
                <div className="flex gap-2">
                  <Input 
                    value={manualQrData}
                    onChange={(e) => setManualQrData(e.target.value)}
                    placeholder="Enter QR code data"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleManualVerify} 
                    disabled={!manualQrData || isVerifying}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {verifiedTicket && (
                <div className="border rounded-md p-4 space-y-3">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <h3 className="font-medium">Runner</h3>
                      <p>{verifiedTicket.runner_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-sm">Event</h3>
                      <p className="text-sm">{verifiedTicket.event_name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Ticket</h3>
                      <p className="text-sm">{verifiedTicket.ticket_name}</p>
                    </div>
                    {verifiedTicket.metadata.bib_number && (
                      <div>
                        <h3 className="font-medium text-sm">Bib Number</h3>
                        <p className="text-sm">{verifiedTicket.metadata.bib_number}</p>
                      </div>
                    )}
                    {verifiedTicket.metadata.race_distance && (
                      <div>
                        <h3 className="font-medium text-sm">Distance</h3>
                        <p className="text-sm">{verifiedTicket.metadata.race_distance}</p>
                      </div>
                    )}
                  </div>
                  
                  <Textarea
                    placeholder="Add notes about this verification (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-4"
                  />
                </div>
              )}
              
              {scanMessage && (
                <Alert variant={scanSuccess ? "default" : "destructive"}>
                  <AlertTitle>{scanSuccess ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>{scanMessage}</AlertDescription>
                </Alert>
              )}
              
              {isVerifying && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/50 p-4">
          {verifiedTicket ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Scan Another
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                disabled={isVerifying} 
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                variant="default" 
                onClick={handleReset} 
                disabled={isVerifying} 
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setShowScanner(!showScanner)} 
              className="w-full"
            >
              {showScanner ? "Hide Scanner" : "Show Scanner"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
} 