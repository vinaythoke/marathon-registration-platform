'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, ChevronRight } from 'lucide-react';
import { verifyPaymentStatus, PaymentStatus } from '@/lib/services/payment-service';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const registrationId = searchParams.get('registrationId');
  const orderId = searchParams.get('order_id');
  
  useEffect(() => {
    async function verifyPayment() {
      if (!registrationId) {
        setError('Registration ID is missing');
        setLoading(false);
        return;
      }
      
      if (!orderId) {
        // Check if this is a free registration
        if (registrationId.startsWith('FREE-')) {
          setStatus('completed');
          setMessage('Free registration completed successfully');
          setLoading(false);
          return;
        }
        
        setError('Order ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        const result = await verifyPaymentStatus(orderId);
        setStatus(result.status);
        setMessage(result.message || '');
        
        // If payment is successful, redirect to confirmation after a short delay
        if (result.success) {
          setTimeout(() => {
            router.push(`/events/${searchParams.get('eventId')}/register/confirmation?registrationId=${registrationId}`);
          }, 3000);
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        setError(err.message || 'Failed to verify payment status');
      } finally {
        setLoading(false);
      }
    }
    
    verifyPayment();
  }, [registrationId, orderId, router, searchParams]);
  
  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Payment {getStatusText(status)}</CardTitle>
          <CardDescription>
            {loading ? 'Verifying your payment status...' : 'Your payment has been processed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-64 mx-auto" />
                <Skeleton className="h-4 w-40 mx-auto" />
              </div>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-in fade-in-50">
              {status === 'completed' ? (
                <>
                  <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-medium text-xl">Payment Successful</h3>
                    <p className="text-muted-foreground">{message || 'Your registration is now confirmed'}</p>
                    <p className="text-sm text-muted-foreground">You will be redirected to your confirmation page...</p>
                  </div>
                </>
              ) : status === 'pending' ? (
                <>
                  <div className="h-20 w-20 rounded-full bg-amber-100 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-amber-600 animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-medium text-xl">Payment Processing</h3>
                    <p className="text-muted-foreground">{message || 'Your payment is being processed'}</p>
                    <p className="text-sm text-muted-foreground">This may take a few moments...</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="h-12 w-12 text-red-600" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-medium text-xl">Payment Failed</h3>
                    <p className="text-muted-foreground">{message || 'Your payment could not be processed'}</p>
                    <p className="text-sm text-muted-foreground">Please try again or contact support</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <div className="flex justify-center pt-4">
            {status === 'completed' ? (
              <Button 
                onClick={() => router.push(`/events/${searchParams.get('eventId')}/register/confirmation?registrationId=${registrationId}`)}
                className="gap-2"
              >
                View Confirmation <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="space-x-4">
                {status === 'failed' && (
                  <Button 
                    onClick={() => router.push(`/events/${searchParams.get('eventId')}/register/payment`)}
                    className="gap-2"
                  >
                    Try Again
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/events')}
                >
                  Browse Events
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusText(status: PaymentStatus): string {
  switch (status) {
    case 'completed': return 'Successful';
    case 'pending': return 'Processing';
    case 'failed': return 'Failed';
    case 'refunded': return 'Refunded';
    default: return 'Status';
  }
} 