'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/database.types';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

// Create a Supabase client for server components
const createServerSupabaseClient = async () => {
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

/**
 * Create a new payment order
 */
export async function createPaymentOrder(registrationId: string): Promise<PaymentData> {
  const supabase = await createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
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
      tickets:tickets (name, price),
      profiles:profiles (name, email, phone)
    `)
    .eq('id', registrationId)
    .eq('user_id', session.user.id)
    .single();
    
  if (regError || !registration) {
    throw new Error(`Registration not found: ${regError?.message}`);
  }
  
  // If ticket is free, mark payment as completed and skip payment
  if (registration.tickets.price === 0) {
    await supabase
      .from('registrations')
      .update({
        payment_status: 'completed',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId);
      
    revalidatePath(`/events/${registration.event_id}/register`);
    
    // Return order data with zero amount
    return {
      orderId: `FREE-${registration.id}`,
      orderAmount: 0,
      orderCurrency: 'INR',
      customerName: registration.profiles.name,
      customerEmail: registration.profiles.email,
      customerPhone: registration.profiles.phone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${registration.event_id}/register/payment-result?registrationId=${registrationId}`
    };
  }
  
  // Create a unique order ID
  const orderId = `${registration.event_id.slice(0, 8)}-${Date.now()}`;
  
  // Generate payment entry
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      id: uuidv4(),
      registration_id: registrationId,
      order_id: orderId,
      amount: registration.tickets.price,
      currency: 'INR',
      status: 'pending'
    })
    .select()
    .single();
    
  if (paymentError) {
    throw new Error(`Error creating payment: ${paymentError.message}`);
  }
  
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
        order_amount: registration.tickets.price,
        order_currency: 'INR',
        customer_details: {
          customer_id: session.user.id,
          customer_name: registration.profiles.name,
          customer_email: registration.profiles.email,
          customer_phone: registration.profiles.phone
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/events/${registration.event_id}/register/payment-result?registrationId=${registrationId}&order_id={order_id}`
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
      customerName: registration.profiles.name,
      customerEmail: registration.profiles.email,
      customerPhone: registration.profiles.phone || '',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/events/${registration.event_id}/register/payment-result?registrationId=${registrationId}`,
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
export async function verifyPaymentStatus(orderId: string): Promise<{
  success: boolean;
  registrationId: string;
  status: PaymentStatus;
  message?: string;
}> {
  const supabase = createServerSupabaseClient();
  
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
export async function processPaymentWebhook(payload: any): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = createServerSupabaseClient();
  
  // Validate webhook signature
  // Implement signature validation based on Cashfree docs
  // This ensures the webhook is actually from Cashfree
  
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
  
  // Get registration details to revalidate path
  const { data: registration } = await supabase
    .from('registrations')
    .select('event_id')
    .eq('id', payment.registration_id)
    .single();
    
  if (registration) {
    revalidatePath(`/events/${registration.event_id}/register`);
  }
  
  return {
    success: true,
    message: 'Webhook processed successfully'
  };
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
  const supabase = createServerSupabaseClient();
  
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
      
    // Update registration
    await supabase
      .from('registrations')
      .update({
        payment_status: 'refunded',
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId);
      
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