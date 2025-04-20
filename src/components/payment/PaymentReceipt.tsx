"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, Printer, RefreshCw } from "lucide-react";
import { formatCurrencyValue } from "@/lib/utils";

interface PaymentReceiptProps {
  receipt: {
    receipt_number: string;
    payment_id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_date: string;
    customer_name: string;
    customer_email: string;
    event_name: string;
    ticket_name: string;
  };
  onDownload: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function PaymentReceipt({
  receipt,
  onDownload,
  onRefresh,
  isLoading = false,
  error = null
}: PaymentReceiptProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setIsPrinting(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-48" />
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
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="flex flex-row items-center justify-between print:pb-2">
        <CardTitle>Receipt #{receipt.receipt_number}</CardTitle>
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={isPrinting}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">
              Payment ID
            </h4>
            <p>{receipt.payment_id}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">
              Order ID
            </h4>
            <p>{receipt.order_id}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">
              Amount
            </h4>
            <p className="font-medium">
              {formatCurrencyValue(receipt.amount, receipt.currency)}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">
              Status
            </h4>
            <p className="capitalize">{receipt.status}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">
              Date
            </h4>
            <p>{new Date(receipt.payment_date).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">
              Customer
            </h4>
            <p>{receipt.customer_name}</p>
            <p className="text-sm text-muted-foreground">
              {receipt.customer_email}
            </p>
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <h4 className="font-medium text-sm text-muted-foreground mb-4">
            Event Details
          </h4>
          <div className="space-y-2">
            <p className="font-medium">{receipt.event_name}</p>
            <p className="text-sm text-muted-foreground">
              Ticket: {receipt.ticket_name}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 