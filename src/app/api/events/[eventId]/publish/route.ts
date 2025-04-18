import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db-client';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';

  try {
    if (isLocalDb) {
      // Simulate success for local development
      // In a real implementation, this would update the database
      return NextResponse.json({ success: true, status: 'published' });
    } else {
      // Use Supabase for production
      const supabase = getClient();
      
      // Verify event exists and belongs to the current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Get user id
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', session.user.id)
        .single();
        
      if (!profile) {
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        );
      }
      
      // Check event ownership
      const { data: event } = await supabase
        .from('events')
        .select('id, status')
        .eq('id', eventId)
        .eq('organizer_id', profile.id)
        .single();
        
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found or you do not have permission' },
          { status: 403 }
        );
      }
      
      if (event.status === 'published') {
        return NextResponse.json(
          { error: 'Event is already published' },
          { status: 400 }
        );
      }
      
      // Update event status to published
      const { error } = await supabase
        .from('events')
        .update({ 
          status: 'published',
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);
        
      if (error) {
        throw error;
      }
      
      return NextResponse.json({ success: true, status: 'published' });
    }
  } catch (error) {
    console.error('Error publishing event:', error);
    return NextResponse.json(
      { error: 'Failed to publish event' },
      { status: 500 }
    );
  }
} 