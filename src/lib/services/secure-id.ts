/**
 * SecureID API Service
 * Handles integration with SecureID API for Aadhaar verification
 */

import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Types for API responses and requests
export interface SecureIDVerificationRequest {
  aadhaarNumber: string;
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
}

export interface SecureIDVerificationResponse {
  success: boolean;
  verificationId: string;
  status: 'pending' | 'verified' | 'failed';
  message?: string;
  error?: string;
}

/**
 * Mock SecureID API call for development
 * In production, this would be replaced with actual API calls to SecureID
 */
export async function mockSecureIDVerify(data: SecureIDVerificationRequest): Promise<SecureIDVerificationResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock validation logic
  if (!data.aadhaarNumber || data.aadhaarNumber.length !== 12) {
    return {
      success: false,
      verificationId: '',
      status: 'failed',
      error: 'Invalid Aadhaar number format'
    };
  }

  if (!data.fullName || !data.dateOfBirth) {
    return {
      success: false,
      verificationId: '',
      status: 'failed',
      error: 'Missing required information'
    };
  }

  // Mock successful verification (90% success rate)
  const isSuccessful = Math.random() < 0.9;
  
  if (isSuccessful) {
    return {
      success: true,
      verificationId: `verify-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'verified',
      message: 'Aadhaar verification successful'
    };
  } else {
    return {
      success: false,
      verificationId: '',
      status: 'failed',
      error: 'Information does not match Aadhaar records'
    };
  }
}

/**
 * Real SecureID API call for production
 * This would make actual API calls to the SecureID service
 */
export async function secureIDVerify(data: SecureIDVerificationRequest): Promise<SecureIDVerificationResponse> {
  try {
    // In production, replace with actual API call
    if (process.env.NODE_ENV === 'production') {
      // Example of how this would work in production
      // const response = await fetch('https://api.secureid.example/verify', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${process.env.SECUREID_API_KEY}`
      //   },
      //   body: JSON.stringify(data)
      // });
      
      // const result = await response.json();
      // return {
      //   success: result.success,
      //   verificationId: result.id,
      //   status: result.status,
      //   message: result.message,
      //   error: result.error
      // };
      
      // For now, use mock implementation
      return await mockSecureIDVerify(data);
    } else {
      // Use mock in development/testing
      return await mockSecureIDVerify(data);
    }
  } catch (error) {
    console.error('SecureID verification error:', error);
    return {
      success: false,
      verificationId: '',
      status: 'failed',
      error: 'Verification service error'
    };
  }
}

/**
 * Save verification result to database
 */
export async function saveVerificationResult(
  userId: string, 
  result: SecureIDVerificationResponse,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase
      .from('verifications')
      .upsert({
        user_id: userId,
        type: 'aadhaar',
        status: result.status,
        verified_at: result.status === 'verified' ? new Date().toISOString() : null,
        metadata: {
          verification_id: result.verificationId,
          ...metadata
        }
      }, {
        onConflict: 'user_id,type'
      });
    
    if (error) {
      console.error('Error saving verification result:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving verification:', error);
    return false;
  }
}

/**
 * Get verification status for a user
 */
export async function getVerificationStatus(userId: string, type: 'aadhaar' | 'email' | 'phone' = 'aadhaar') {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .single();
    
    if (error) {
      console.error('Error getting verification status:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error checking verification status:', error);
    return null;
  }
} 