'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { verifyAadhaar } from '@/lib/actions/verification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, CheckCircle, AlertCircle, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// Verification status type from database
export interface VerificationStatus {
  id: string;
  user_id: string;
  type: 'aadhaar' | 'email' | 'phone';
  status: 'pending' | 'verified' | 'failed';
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
}

// Props for AadhaarVerification component
interface AadhaarVerificationProps {
  verificationStatus?: VerificationStatus | null;
  userProfile?: {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    phone?: string;
  } | null;
}

// Schema for verification form
const verificationFormSchema = z.object({
  aadhaarNumber: z.string().length(12, { message: 'Aadhaar number must be 12 digits' }),
  fullName: z.string().min(3, { message: 'Please enter your full name as it appears on your Aadhaar card' }),
  dateOfBirth: z.string().min(1, { message: 'Date of birth is required' }),
  phoneNumber: z.string().min(10, { message: 'Phone number must be at least 10 digits' }),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

export function AadhaarVerification({ verificationStatus, userProfile }: AadhaarVerificationProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with user profile data if available
  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      aadhaarNumber: '',
      fullName: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : '',
      dateOfBirth: userProfile?.date_of_birth || '',
      phoneNumber: userProfile?.phone || '',
    },
  });

  // Handle form submission
  async function onSubmit(data: VerificationFormValues) {
    setIsSubmitting(true);
    try {
      // Create form data for server action
      const formData = new FormData();
      formData.append('aadhaarNumber', data.aadhaarNumber);
      formData.append('fullName', data.fullName);
      formData.append('dateOfBirth', data.dateOfBirth);
      formData.append('phoneNumber', data.phoneNumber);
      
      // Call server action
      const result = await verifyAadhaar(formData);
      
      if (result.success) {
        toast({
          title: 'Verification Successful',
          description: 'Your Aadhaar details have been verified successfully.',
          variant: 'default',
        });
        router.refresh();
      } else {
        toast({
          title: 'Verification Failed',
          description: result.error || 'There was an error verifying your Aadhaar details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Render verification status badge
  function renderVerificationBadge() {
    if (!verificationStatus) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          <span>Not Verified</span>
        </div>
      );
    }

    switch (verificationStatus.status) {
      case 'verified':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Verified</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="h-5 w-5" />
            <span>Pending Verification</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Verification Failed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>Not Verified</span>
          </div>
        );
    }
  }

  // If already verified, show verification status
  if (verificationStatus?.status === 'verified') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aadhaar Verification</span>
            {renderVerificationBadge()}
          </CardTitle>
          <CardDescription>
            Your identity has been verified through Aadhaar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ShieldCheck className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verification Complete</h3>
            <p className="text-muted-foreground mb-2">
              Your Aadhaar identity has been successfully verified.
            </p>
            {verificationStatus.verified_at && (
              <p className="text-sm text-muted-foreground">
                Verified on {new Date(verificationStatus.verified_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Otherwise, show verification form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Aadhaar Verification</span>
          {renderVerificationBadge()}
        </CardTitle>
        <CardDescription>
          Verify your identity with your Aadhaar card to participate in official events.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your 12-digit Aadhaar number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (as on Aadhaar)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="text-sm text-muted-foreground mt-4">
              <p className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                Your personal information will be securely shared with SecureID for verification purposes only.
              </p>
              <p>By submitting, you consent to the processing of your Aadhaar data for identity verification.</p>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Identity'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <p className="text-sm text-muted-foreground">
          Having trouble? Make sure your details exactly match what's on your Aadhaar card.
        </p>
      </CardFooter>
    </Card>
  );
} 