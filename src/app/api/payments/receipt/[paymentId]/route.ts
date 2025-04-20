import { createServerSupabaseClient } from '@/lib/services/payment-service';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get receipt
    const { data: receipt, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('payment_id', params.paymentId)
      .single();
      
    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch receipt: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ receipt });
  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 