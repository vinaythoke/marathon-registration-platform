import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const eventId = searchParams.get('eventId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('payment_method_analytics')
      .select(`
        *,
        payment_methods (
          name,
          method_code,
          provider
        )
      `)
      .eq('event_id', eventId);

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: analytics, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch payment analytics' },
        { status: 500 }
      );
    }

    // Calculate totals
    const totals = analytics.reduce((acc, curr) => ({
      total_transactions: acc.total_transactions + curr.total_transactions,
      total_amount: acc.total_amount + curr.total_amount,
      success_count: acc.success_count + curr.success_count,
      failure_count: acc.failure_count + curr.failure_count
    }), {
      total_transactions: 0,
      total_amount: 0,
      success_count: 0,
      failure_count: 0
    });

    // Calculate success rate and average transaction value
    const successRate = totals.total_transactions > 0
      ? (totals.success_count / totals.total_transactions) * 100
      : 0;

    const avgTransactionValue = totals.total_transactions > 0
      ? totals.total_amount / totals.total_transactions
      : 0;

    return NextResponse.json({
      analytics,
      totals: {
        ...totals,
        success_rate: successRate,
        avg_transaction_value: avgTransactionValue
      }
    });
  } catch (error: any) {
    console.error('Error fetching payment method analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 