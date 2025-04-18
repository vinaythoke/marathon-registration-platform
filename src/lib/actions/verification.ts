'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';

import { 
  secureIDVerify, 
  saveVerificationResult, 
  getVerificationStatus,
  SecureIDVerificationRequest 
} from '@/lib/services/secure-id';

/**
 * Verify Aadhaar information through SecureID
 */
export async function verifyAadhaar(formData: FormData) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }
    
    // Extract verification data from form
    const verificationData: SecureIDVerificationRequest = {
      aadhaarNumber: formData.get('aadhaarNumber') as string,
      fullName: formData.get('fullName') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      phoneNumber: formData.get('phoneNumber') as string
    };
    
    // Validate input data
    if (!verificationData.aadhaarNumber || verificationData.aadhaarNumber.length !== 12) {
      return {
        success: false,
        error: 'Please enter a valid 12-digit Aadhaar number'
      };
    }
    
    if (!verificationData.fullName) {
      return {
        success: false,
        error: 'Please enter your full name as it appears on your Aadhaar card'
      };
    }
    
    if (!verificationData.dateOfBirth) {
      return {
        success: false,
        error: 'Please enter your date of birth'
      };
    }
    
    // Send verification request to SecureID API
    const result = await secureIDVerify(verificationData);
    
    // Save verification result to database
    if (result) {
      await saveVerificationResult(session.user.id, result, {
        verified_at: new Date().toISOString()
      });
    }
    
    // Revalidate profile page
    revalidatePath('/dashboard/profile');
    
    return {
      success: result.success,
      status: result.status,
      message: result.success ? result.message : result.error
    };
    
  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      error: 'An error occurred during verification'
    };
  }
}

/**
 * Get current verification status for the authenticated user
 */
export async function getUserVerificationStatus() {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return null;
    }
    
    // Get verification status
    const { data } = await supabase
      .from('verifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('type', 'aadhaar')
      .single();
    
    return data;
    
  } catch (error) {
    console.error('Error getting verification status:', error);
    return null;
  }
} 