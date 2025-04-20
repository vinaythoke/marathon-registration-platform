import { createServerSupabaseClient } from '@/lib/services/payment-service';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = supabase
      .from('payment_analytics')
      .select('*')
      .eq('event_id', params.eventId)
      .order('date', { ascending: false });
      
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    const { data: analytics, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch payment analytics: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Calculate totals
    const totals = analytics.reduce((acc, day) => ({
      total_payments: acc.total_payments + day.total_payments,
      total_amount: acc.total_amount + day.total_amount,
      successful_payments: acc.successful_payments + day.successful_payments,
      failed_payments: acc.failed_payments + day.failed_payments,
      refunded_payments: acc.refunded_payments + day.refunded_payments,
      average_amount: acc.total_amount / acc.total_payments
    }), {
      total_payments: 0,
      total_amount: 0,
      successful_payments: 0,
      failed_payments: 0,
      refunded_payments: 0,
      average_amount: 0
    });
    
    return NextResponse.json({
      daily: analytics,
      totals
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
} 