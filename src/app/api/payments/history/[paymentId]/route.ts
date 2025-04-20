import { createServerSupabaseClient } from '@/lib/services/payment-service';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { paymentId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get payment history
    const { data: history, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('payment_id', params.paymentId)
      .order('created_at', { ascending: false });
      
    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch payment history: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 