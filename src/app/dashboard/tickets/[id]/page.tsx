"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTicketById } from "@/lib/services/ticket-service";
import { DigitalTicket as DigitalTicketType } from "@/components/tickets/types";
import DigitalTicket from "@/components/tickets/DigitalTicket";
import VerificationHistory from "@/components/tickets/VerificationHistory";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Share2, Loader2, History, FileText } from "lucide-react";
import Link from "next/link";

// Helper function to download the ticket as a PNG image
const downloadTicketAsPNG = (ticketId: string, runnerName: string) => {
  const ticketElement = document.getElementById('digital-ticket');
  if (!ticketElement) return;

  // Use html2canvas (would require installing this package)
  console.log("Download functionality would convert the ticket to PNG using html2canvas");
  
  // For a real implementation, install html2canvas and use this:
  /*
  html2canvas(ticketElement).then(canvas => {
    const link = document.createElement('a');
    link.download = `${runnerName.replace(/\s+/g, '-')}-ticket-${ticketId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
  */

  // For now, just alert the user that this is a placeholder
  alert("Download functionality placeholder: This would save the ticket as a PNG image.");
};

// Helper function to share the ticket
const shareTicket = async (ticketId: string, eventName: string) => {
  if (typeof navigator.share !== 'undefined') {
    try {
      await navigator.share({
        title: `My ticket for ${eventName}`,
        text: `Check out my ticket for ${eventName}!`,
        url: window.location.href,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      alert("Couldn't share the ticket. Try copying the link manually.");
    }
  } else {
    // Fallback for browsers that don't support Web Share API
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert("Ticket link copied to clipboard!"))
      .catch(err => {
        console.error('Could not copy text: ', err);
        alert("Couldn't copy the link. Please copy it manually.");
      });
  }
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<DigitalTicketType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("ticket");
  const router = useRouter();

  useEffect(() => {
    async function fetchTicket() {
      try {
        setLoading(true);
        setError(null);
        
        if (!id || typeof id !== 'string') {
          setError("Invalid ticket ID");
          setLoading(false);
          return;
        }
        
        const ticketData = await getTicketById(id);
        
        if (!ticketData) {
          setError("Ticket not found");
          setLoading(false);
          return;
        }
        
        setTicket(ticketData);
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError("Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [id]);

  const handleDownload = () => {
    if (ticket) {
      downloadTicketAsPNG(ticket.id, ticket.runner_name);
    }
  };

  const handleShare = () => {
    if (ticket) {
      shareTicket(ticket.id, ticket.event_name);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading ticket details...</p>
          </div>
        </div>
      ) : error ? (
        <Alert variant="destructive" className="my-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <Link href="/dashboard/tickets">
                <Button variant="outline" size="sm">Return to all tickets</Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      ) : ticket ? (
        <div>
          <h1 className="text-3xl font-bold mb-6">{ticket.event_name} Ticket</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="ticket" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Ticket
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="mr-2 h-4 w-4" />
                Verification History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ticket">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1" id="digital-ticket">
                  <DigitalTicket 
                    ticket={ticket} 
                    onDownload={handleDownload}
                    onShare={handleShare}
                  />
                </div>
                
                <div className="flex-1 space-y-6">
                  <div className="bg-muted p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Ticket Instructions</h2>
                    <div className="space-y-4">
                      <p>1. Present this QR code at the event registration desk to collect your race pack.</p>
                      <p>2. Keep your ticket accessible during the event for verification purposes.</p>
                      <p>3. You can download your ticket to keep it offline or share it with others if needed.</p>
                      <p>4. For any issues with your ticket, please contact the event organizers.</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button 
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Ticket
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Ticket
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="md:col-span-2 lg:col-span-1">
                  <VerificationHistory ticketId={ticket.id} />
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <div className="bg-muted p-6 rounded-lg">
                    <h2 className="text-xl font-semibold mb-4">Verification Information</h2>
                    <div className="space-y-4">
                      <p>This section shows the history of your ticket verifications.</p>
                      <p>Each time your ticket is scanned or verified by an event volunteer or staff member, a record is created.</p>
                      <p>You can use this information to track when and where your ticket was verified throughout the event.</p>
                      <p>If you believe there are any discrepancies, please contact the event organizers.</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No ticket found</p>
        </div>
      )}
    </div>
  );
} 