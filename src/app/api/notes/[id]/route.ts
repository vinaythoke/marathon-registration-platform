import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to create Supabase client
const createSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient(
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

// Get a specific note
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const supabase = createSupabaseClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the note
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
      throw error;
    }
    
    // Check if user owns the note
    if (data.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 }
    );
  }
}

// Update a note
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const supabase = createSupabaseClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const updates = await request.json();
    
    // Validate required fields
    if (!updates.title && !updates.content) {
      return NextResponse.json(
        { error: 'Title or content is required for an update' },
        { status: 400 }
      );
    }
    
    // Check if the note exists and belongs to the user
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (noteError) {
      if (noteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
      throw noteError;
    }
    
    // Check if user owns the note
    if (noteData.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Update the note
    const { data, error } = await supabase
      .from('notes')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// Delete a note
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const supabase = createSupabaseClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the note exists and belongs to the user
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (noteError) {
      if (noteError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }
      throw noteError;
    }
    
    // Check if user owns the note
    if (noteData.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete the note
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
} 