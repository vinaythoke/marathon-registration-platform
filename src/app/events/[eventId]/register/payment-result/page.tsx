'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { verifyPaymentStatus, PaymentStatus } from '@/lib/services/payment-service';
import PaymentReceipt from '@/components/payment/PaymentReceipt';
import PaymentStatusHistory from '@/components/payment/PaymentStatusHistory';
import type { PaymentTransaction } from '@/types/payment';

export default function PaymentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<any>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  
  const registrationId = searchParams.get('registrationId');
  const orderId = searchParams.get('order_id');
  
  const verifyPayment = useCallback(async () => {
    if (!registrationId) {
      setError('Registration ID is missing');
      setLoading(false);
      return;
    }
    
    if (!orderId) {
      // Check if this is a free registration
      if (registrationId.startsWith('FREE-')) {
        setStatus('completed');
        setReceipt({
          receipt_number: registrationId,
          payment_id: registrationId,
          order_id: registrationId,
          amount: 0,
          currency: 'INR',
          status: 'completed',
          payment_date: new Date().toISOString(),
          customer_name: 'Free Registration',
          customer_email: '',
          event_name: '',
          ticket_name: ''
        });
        setTransactions([{
          id: registrationId,
          payment_id: registrationId,
          transaction_type: 'payment',
          amount: 0,
          currency: 'INR',
          status: 'success',
          created_at: new Date().toISOString()
        }]);
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
      
      if (result.receipt) {
        setReceipt(result.receipt);
      }
      
      if (result.transactions) {
        setTransactions(result.transactions);
      }
      
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
  }, [registrationId, orderId, router, searchParams]);
  
  useEffect(() => {
    verifyPayment();
  }, [verifyPayment]);

  const handleRefresh = () => {
    setLoading(true);
    verifyPayment();
  };
  
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      {receipt && (
        <PaymentReceipt
          receipt={receipt}
          onDownload={() => {/* TODO: Implement receipt download */}}
          onRefresh={handleRefresh}
          isLoading={loading}
          error={error}
        />
      )}
      
      <PaymentStatusHistory
        transactions={transactions}
        onRefresh={handleRefresh}
        isLoading={loading}
        error={error}
      />
      
      <div className="flex justify-end space-x-4">
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
    </div>
  );
} 