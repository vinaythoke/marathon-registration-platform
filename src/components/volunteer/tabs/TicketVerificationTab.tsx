"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DigitalTicket } from "@/components/tickets/types";
import TicketScanner from "../TicketScanner";
import { getTicketVerificationHistory } from "@/lib/services/ticket-service";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface TicketVerificationTabProps {
  eventId: string;
}

export default function TicketVerificationTab({ eventId }: TicketVerificationTabProps) {
  const [loading, setLoading] = useState(false);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [activeTicket, setActiveTicket] = useState<DigitalTicket | null>(null);
  const [activeTab, setActiveTab] = useState<string>("scan");

  // Function to load verification history
  const loadVerificationHistory = async () => {
    if (!eventId) return;
    
    try {
      setLoading(true);
      
      // In a real implementation, we would filter by eventId as well
      // For now, we'll just fetch the most recent verifications
      const history = await getTicketVerificationHistory(activeTicket?.id || "");
      
      setVerifications(history);
    } catch (error) {
      console.error("Error loading verification history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load verification history when the active ticket changes
  useEffect(() => {
    if (activeTicket) {
      loadVerificationHistory();
    }
  }, [activeTicket]);

  // Handle successful verification
  const handleVerification = (ticket: DigitalTicket) => {
    setActiveTicket(ticket);
    setActiveTab("history");
    loadVerificationHistory();
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPpp"); // Format as "Jan 1, 2021, 12:00 PM"
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Verified</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Verification</CardTitle>
        <CardDescription>
          Scan and verify runner tickets for event participation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scan" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="scan">Scan Tickets</TabsTrigger>
            <TabsTrigger value="history">Verification History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="scan">
            <TicketScanner 
              eventId={eventId}
              onSuccessfulVerification={handleVerification}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : verifications.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Verified By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-gray-200">
                      {verifications.map((verification) => (
                        <tr key={verification.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {formatDate(verification.verified_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {verification.verifier?.name || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {getStatusBadge(verification.status)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {verification.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {activeTicket ? (
                    <p>No verification history available for this ticket.</p>
                  ) : (
                    <p>Scan a ticket to view its verification history.</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 