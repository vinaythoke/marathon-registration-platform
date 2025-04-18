"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getTicketVerificationHistory } from '@/lib/services/ticket-service';
import { format } from 'date-fns';
import { Eye, History, RefreshCw, Loader2 } from 'lucide-react';

interface VerificationHistoryProps {
  ticketId: string;
}

export default function VerificationHistory({ ticketId }: VerificationHistoryProps) {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch verification history
      const history = await getTicketVerificationHistory(ticketId);
      setVerifications(history);
    } catch (err: any) {
      console.error('Error fetching verification history:', err);
      setError(err.message || 'Failed to load verification history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (ticketId) {
      fetchHistory();
    }
  }, [ticketId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            Verification History
          </CardTitle>
          <CardDescription>Record of ticket verification attempts</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={loading || refreshing}
        >
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          // Loading state
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="h-[1px] bg-slate-200 my-2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="p-4 text-center text-red-600">
            <p>{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchHistory} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : verifications.length === 0 ? (
          // Empty state
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No verification records found for this ticket.
            </p>
          </div>
        ) : (
          // Data display
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div key={verification.id} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {verification.verifier?.name || 'Unknown Staff'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(verification.verified_at)}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(verification.status)}
                  </div>
                </div>
                
                {verification.notes && (
                  <div className="mt-2 text-sm bg-muted p-2 rounded-md">
                    <div className="font-medium">Notes:</div>
                    <p>{verification.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 