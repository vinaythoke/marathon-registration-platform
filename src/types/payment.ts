export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentMethod {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon_url?: string;
  is_enabled: boolean;
  config?: Json;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_session_id?: string;
  order_token?: string;
  cf_order_id?: string;
  transaction_data?: Json;
  refund_data?: Json;
  payment_method_id?: string;
  billing_address?: {
    name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
  };
  shipping_address?: {
    name?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
  };
  customer_notes?: string;
  admin_notes?: string;
  refund_reason?: string;
  refund_amount?: number;
  refund_status?: string;
  refund_transaction_id?: string;
  is_test: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  payment_id: string;
  transaction_type: 'payment' | 'refund' | 'chargeback';
  amount: number;
  currency: string;
  status: string;
  gateway_transaction_id?: string;
  gateway_response?: Json;
  error_message?: string;
  created_at: string;
}

export interface PaymentSetting {
  id: string;
  setting_key: string;
  setting_value: Json;
  description?: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

// Types for the Cashfree API responses
export interface CashfreeOrderResponse {
  order_id: string;
  order_status: string;
  order_token: string;
  order_amount: number;
  cf_order_id: string;
  payment_session_id: string;
}

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