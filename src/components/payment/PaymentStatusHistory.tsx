"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { formatCurrencyValue, formatRelativeTime } from "@/lib/utils";
import type { PaymentTransaction } from '@/types/payment';

interface PaymentStatusHistoryProps {
  transactions: PaymentTransaction[];
  onRefresh: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function PaymentStatusHistory({
  transactions,
  onRefresh,
  isLoading = false,
  error = null
}: PaymentStatusHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment History</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No transaction history available
          </p>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium capitalize">
                      {transaction.transaction_type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatRelativeTime(transaction.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrencyValue(transaction.amount, transaction.currency)}
                    </p>
                    <p className={`text-sm capitalize ${
                      transaction.status === 'success'
                        ? 'text-green-600'
                        : transaction.status === 'failed'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
                
                {transaction.error_message && (
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {transaction.error_message}
                  </p>
                )}
                
                {transaction.gateway_transaction_id && (
                  <p className="text-sm text-muted-foreground">
                    Transaction ID: {transaction.gateway_transaction_id}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 