'use server';

import { createServerClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/database.types';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

// Create a Supabase client for server components
export const createServerSupabaseClient = async (): Promise<SupabaseClient<Database>> => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

// Type definitions for payment
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentData {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl?: string;
  paymentSessionId?: string;
  paymentOrderId?: string;
}

interface CashfreeOrderResponse {
  order_id: string;
  order_status: string;
  order_token: string;
  order_amount: number;
  cf_order_id: string;
  payment_session_id: string;
}

interface TicketDetails {
  name: string;
  price: number;
}

interface ProfileDetails {
  name: string;
  email: string;
  phone: string | null;
}

interface RegistrationDetails {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  status: string;
  tickets: TicketDetails;
  profiles: ProfileDetails;
}

export interface PaymentVerificationResult {
  success: boolean;
  registrationId: string;
  status: PaymentStatus;
  message?: string;
  receipt?: {
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
  transactions?: PaymentTransaction[];
}

/**
 * Track payment history
 */
async function trackPaymentHistory(
  paymentId: string,
  status: PaymentStatus,
  amount: number,
  transactionData?: any,
  notes?: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  await supabase
    .from('payment_history')
    .insert({
      payment_id: paymentId,
      status,
      amount,
      transaction_data: transactionData,
      notes
    });
}

/**
 * Update payment analytics
 */
async function updatePaymentAnalytics(
  eventId: string,
  status: PaymentStatus,
  amount: number
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split('T')[0];
  
  // Get or create analytics record for today
  const { data: analytics, error } = await supabase
    .from('payment_analytics')
    .select()
    .eq('event_id', eventId)
    .eq('date', today)
    .single();
    
  if (error) {
    // Create new record if not exists
    await supabase
      .from('payment_analytics')
      .insert({
        event_id: eventId,
        date: today,
        total_payments: 1,
        total_amount: amount,
        successful_payments: status === 'completed' ? 1 : 0,
        failed_payments: status === 'failed' ? 1 : 0,
        refunded_payments: status === 'refunded' ? 1 : 0,
        average_amount: amount
      });
  } else {
    // Update existing record
    const newTotalAmount = analytics.total_amount + amount;
    const newTotalPayments = analytics.total_payments + 1;
    
    await supabase
      .from('payment_analytics')
      .update({
        total_payments: newTotalPayments,
        total_amount: newTotalAmount,
        successful_payments: status === 'completed' ? analytics.successful_payments + 1 : analytics.successful_payments,
        failed_payments: status === 'failed' ? analytics.failed_payments + 1 : analytics.failed_payments,
        refunded_payments: status === 'refunded' ? analytics.refunded_payments + 1 : analytics.refunded_payments,
        average_amount: newTotalAmount / newTotalPayments,
        updated_at: new Date().toISOString()
      })
      .eq('id', analytics.id);
  }
}

/**
 * Generate receipt number
 */
function generateReceiptNumber(orderId: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `RCP-${orderId.slice(0, 8)}-${timestamp}`;
}

/**
 * Create payment receipt
 */
async function createPaymentReceipt(
  paymentId: string,
  orderId: string,
  transactionData: any
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  
  await supabase
    .from('payment_receipts')
    .insert({
      payment_id: paymentId,
      receipt_number: generateReceiptNumber(orderId),
      receipt_data: transactionData
    });
}

/**
 * Create a new payment order
 */
export async function createPaymentOrder(registrationId: string, paymentMethodId: string): Promise<PaymentData> {
  const supabase = await createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }

  // Verify payment method exists and is active
  const { data: paymentMethod, error: methodError } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('id', paymentMethodId)
    .eq('is_active', true)
    .single();

  if (methodError || !paymentMethod) {
    throw new Error('Invalid or inactive payment method');
  }
  
  // Get registration details
  const { data: registration, error: regError } = await supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      user_id,
      ticket_id,
      status,
      tickets!inner (name, price),
      profiles!inner (name, email, phone)
    `)
    .eq('id', registrationId)
    .eq('user_id', session.user.id)
    .single();
    
  if (regError || !registration) {
    throw new Error(`Registration not found: ${regError?.message}`);
  }
  
  const typedRegistration = {
    ...registration,
    tickets: registration.tickets[0],
    profiles: registration.profiles[0]
  } as RegistrationDetails;
  
  // If ticket is free, mark payment as completed and skip payment
  if (typedRegistration.tickets.price === 0) {
    await supabase
      .from('registrations')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId);
      
    revalidatePath(`/events/${typedRegistration.event_id}/register`);
    
    // Return order data with zero amount
    return {
      orderId: `FREE-${typedRegistration.id}`,
      orderAmount: 0,
      orderCurrency: 'INR',
      customerName: typedRegistration.profiles.name,
      customerEmail: typedRegistration.profiles.email,
      customerPhone: typedRegistration.profiles.phone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${typedRegistration.event_id}/register/payment-result?registrationId=${registrationId}`
    };
  }
  
  // Create a unique order ID
  const orderId = `${typedRegistration.event_id.slice(0, 8)}-${Date.now()}`;
  
  // Generate payment entry
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      id: uuidv4(),
      registration_id: registrationId,
      order_id: orderId,
      amount: typedRegistration.tickets.price,
      currency: 'INR',
      status: 'pending'
    })
    .select()
    .single();
    
  if (paymentError) {
    throw new Error(`Error creating payment: ${paymentError.message}`);
  }
  
  // Track initial payment history
  await trackPaymentHistory(
    payment.id,
    'pending',
    typedRegistration.tickets.price,
    null,
    'Payment order created'
  );
  
  // Update analytics for new payment
  await updatePaymentAnalytics(
    typedRegistration.event_id,
    'pending',
    typedRegistration.tickets.price
  );
  
  // Update registration with payment ID
  await supabase
    .from('registrations')
    .update({
      payment_status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', registrationId);
  
  // Make API call to Cashfree to create order
  try {
    const response = await fetch(`${process.env.CASHFREE_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: typedRegistration.tickets.price,
        order_currency: 'INR',
        customer_details: {
          customer_id: session.user.id,
          customer_name: typedRegistration.profiles.name,
          customer_email: typedRegistration.profiles.email,
          customer_phone: typedRegistration.profiles.phone
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${typedRegistration.event_id}/register/payment-result?registrationId=${registrationId}&order_id={order_id}`
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cashfree API error: ${errorData.message || response.statusText}`);
    }
    
    const orderData: CashfreeOrderResponse = await response.json();
    
    // Update payment with Cashfree response data
    await supabase
      .from('payments')
      .update({
        payment_session_id: orderData.payment_session_id,
        order_token: orderData.order_token,
        cf_order_id: orderData.cf_order_id,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    return {
      orderId: orderData.order_id,
      orderAmount: orderData.order_amount,
      orderCurrency: 'INR',
      customerName: typedRegistration.profiles.name,
      customerEmail: typedRegistration.profiles.email,
      customerPhone: typedRegistration.profiles.phone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${typedRegistration.event_id}/register/payment-result?registrationId=${registrationId}`,
      paymentSessionId: orderData.payment_session_id
    };
  } catch (error) {
    console.error('Payment creation error:', error);
    // Update payment status to failed
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
      
    throw new Error(`Failed to create payment: ${error.message}`);
  }
}

/**
 * Verify payment status
 */
export async function verifyPaymentStatus(orderId: string): Promise<PaymentVerificationResult> {
  const supabase = await createServerSupabaseClient();
  
  // Get payment details from our database
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, registration_id, order_id, amount, status')
    .eq('order_id', orderId)
    .single();
    
  if (paymentError || !payment) {
    throw new Error(`Payment not found: ${paymentError?.message}`);
  }
  
  // Get the current payment status from Cashfree
  try {
    const response = await fetch(`${process.env.CASHFREE_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cashfree API error: ${errorData.message || response.statusText}`);
    }
    
    const orderData = await response.json();
    
    // Process the order status
    let paymentStatus: PaymentStatus = 'pending';
    
    switch (orderData.order_status) {
      case 'PAID':
        paymentStatus = 'completed';
        break;
      case 'ACTIVE':
        paymentStatus = 'pending';
        break;
      case 'EXPIRED':
      case 'CANCELLED':
        paymentStatus = 'failed';
        break;
      case 'REFUNDED':
        paymentStatus = 'refunded';
        break;
      default:
        paymentStatus = 'pending';
    }
    
    // Update our database with the latest status
    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        transaction_data: orderData,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
      
    // If payment is completed, update registration status
    if (paymentStatus === 'completed') {
      await supabase
        .from('registrations')
        .update({
          payment_status: 'completed',
          status: 'confirmed',
          transaction_id: orderData.cf_order_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.registration_id);
    } else if (paymentStatus === 'failed') {
      await supabase
        .from('registrations')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.registration_id);
    }
    
    // Track payment history
    await trackPaymentHistory(
      payment.id,
      paymentStatus,
      payment.amount,
      orderData,
      `Payment status updated to ${paymentStatus}`
    );
    
    // Update analytics
    const { data: registration } = await supabase
      .from('registrations')
      .select('event_id')
      .eq('id', payment.registration_id)
      .single();
      
    if (registration) {
      await updatePaymentAnalytics(
        registration.event_id,
        paymentStatus,
        payment.amount
      );
    }
    
    // Create receipt for completed payments
    if (paymentStatus === 'completed') {
      await createPaymentReceipt(
        payment.id,
        orderId,
        orderData
      );
    }
    
    // Return the payment verification result
    return {
      success: paymentStatus === 'completed',
      registrationId: payment.registration_id,
      status: paymentStatus,
      message: orderData.order_note || 'Payment verification completed'
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      registrationId: payment.registration_id,
      status: 'failed',
      message: `Payment verification failed: ${error.message}`
    };
  }
}

/**
 * Process payment webhook
 */
export async function processPaymentWebhook(payload: any, signature: string, timestamp: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createServerSupabaseClient();
  
  // Verify webhook signature using Cashfree's built-in verification
  try {
    const isValid = await verifyWebhookSignature(signature, JSON.stringify(payload), timestamp);
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid webhook signature'
      };
    }
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return {
      success: false,
      message: `Signature verification failed: ${error.message}`
    };
  }
  
  const orderId = payload.data.order.order_id;
  
  // Get payment details from our database
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, registration_id, order_id, amount, status')
    .eq('order_id', orderId)
    .single();
    
  if (paymentError || !payment) {
    return {
      success: false,
      message: `Payment not found: ${paymentError?.message}`
    };
  }
  
  // Process the order status
  let paymentStatus: PaymentStatus = 'pending';
  
  switch (payload.data.order.order_status) {
    case 'PAID':
      paymentStatus = 'completed';
      break;
    case 'ACTIVE':
      paymentStatus = 'pending';
      break;
    case 'EXPIRED':
    case 'CANCELLED':
      paymentStatus = 'failed';
      break;
    case 'REFUNDED':
      paymentStatus = 'refunded';
      break;
    default:
      paymentStatus = 'pending';
  }
  
  // Update our database with the latest status
  await supabase
    .from('payments')
    .update({
      status: paymentStatus,
      transaction_data: payload.data,
      updated_at: new Date().toISOString()
    })
    .eq('order_id', orderId);
    
  // Track payment history
  await trackPaymentHistory(
    payment.id,
    paymentStatus,
    payment.amount,
    payload.data,
    `Payment status updated to ${paymentStatus}`
  );
  
  // Update analytics
  const { data: registration } = await supabase
    .from('registrations')
    .select('event_id')
    .eq('id', payment.registration_id)
    .single();
    
  if (registration) {
    await updatePaymentAnalytics(
      registration.event_id,
      paymentStatus,
      payment.amount
    );
  }
  
  // Create receipt for completed payments
  if (paymentStatus === 'completed') {
    await createPaymentReceipt(
      payment.id,
      orderId,
      payload.data
    );
  }
  
  // If payment is completed, update registration status
  if (paymentStatus === 'completed') {
    await supabase
      .from('registrations')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
        transaction_id: payload.data.order.cf_order_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.registration_id);
  } else if (paymentStatus === 'failed') {
    await supabase
      .from('registrations')
      .update({
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.registration_id);
  }
  
  return {
    success: true,
    message: `Payment webhook processed successfully. Status: ${paymentStatus}`
  };
}

/**
 * Verify webhook signature using Cashfree's method
 */
async function verifyWebhookSignature(signature: string, payload: string, timestamp: string): Promise<boolean> {
  const { Cashfree } = require('cashfree-pg');
  
  try {
    return Cashfree.PGVerifyWebhookSignature(signature, payload, timestamp);
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Get refund for a payment
 */
export async function createRefund(
  registrationId: string, 
  reason: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createServerSupabaseClient();
  
  // Get payment details
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('id, order_id, amount, status')
    .eq('registration_id', registrationId)
    .single();
    
  if (paymentError || !payment) {
    throw new Error(`Payment not found: ${paymentError?.message}`);
  }
  
  if (payment.status !== 'completed') {
    throw new Error('Can only refund completed payments');
  }
  
  // Call Cashfree refund API
  try {
    const response = await fetch(`${process.env.CASHFREE_API_URL}/orders/${payment.order_id}/refunds`, {
      method: 'POST',
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID!,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refund_amount: payment.amount,
        refund_id: `REF-${payment.order_id}`,
        refund_note: reason
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cashfree API error: ${errorData.message || response.statusText}`);
    }
    
    const refundData = await response.json();
    
    // Update payment status to refunded
    await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refund_data: refundData,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', payment.order_id);
      
    // Track refund in payment history
    await trackPaymentHistory(
      payment.id,
      'refunded',
      payment.amount,
      refundData,
      reason
    );
    
    // Update registration
    await supabase
      .from('registrations')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId);
      
    // Update analytics for refund
    const { data: registration } = await supabase
      .from('registrations')
      .select('event_id')
      .eq('id', registrationId)
      .single();
      
    if (registration) {
      await updatePaymentAnalytics(
        registration.event_id,
        'refunded',
        payment.amount
      );
    }
    
    return {
      success: true,
      message: 'Refund initiated successfully'
    };
  } catch (error) {
    console.error('Refund error:', error);
    return {
      success: false,
      message: `Refund failed: ${error.message}`
    };
  }
} 