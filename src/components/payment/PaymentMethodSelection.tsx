"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { PaymentMethod } from '@/types/payment';

interface PaymentMethodSelectionProps {
  methods: PaymentMethod[];
  selectedMethodId: string | null;
  onMethodSelect: (methodId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function PaymentMethodSelection({
  methods,
  selectedMethodId,
  onMethodSelect,
  isLoading = false,
  error = null
}: PaymentMethodSelectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-4 w-4 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
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

  if (!methods.length) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No payment methods available.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <RadioGroup
          value={selectedMethodId || undefined}
          onValueChange={onMethodSelect}
        >
          <div className="space-y-4">
            {methods.map((method) => (
              <div
                key={method.id}
                className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                  selectedMethodId === method.id
                    ? 'bg-primary/5 border-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="mt-1"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={method.id}
                      className="font-medium cursor-pointer"
                    >
                      {method.display_name}
                    </Label>
                    {method.icon_url && (
                      <img
                        src={method.icon_url}
                        alt={method.name}
                        className="h-6 w-auto"
                      />
                    )}
                  </div>
                  {method.description && (
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
} 