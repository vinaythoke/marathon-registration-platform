import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/services/payment-service";

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const payload = await req.json();
    
    // Validate the request contains expected fields
    if (!payload || !payload.data || !payload.data.order || !payload.data.order.order_id) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
    
    // Get CashFree signature from headers
    const signature = req.headers.get('x-cashfree-signature') || '';
    
    // TODO: Validate signature with CashFree SECRET_KEY
    // This should be implemented in production for security
    // Using a mechanism recommended by CashFree
    
    // Process the webhook
    const result = await processPaymentWebhook(payload);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to process webhook' 
    }, { status: 500 });
  }
}

// To handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({ success: true }, { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-cashfree-signature',
      'Access-Control-Max-Age': '86400'
    }
  });
} 