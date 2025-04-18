import { createClient } from '@/lib/supabase/server';

export async function createTicketVerificationsTable() {
  const supabase = createClient();
  
  // Check if table already exists
  const { data: existingTables } = await supabase.from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .eq('tablename', 'ticket_verifications');
  
  if (existingTables && existingTables.length > 0) {
    console.log('Table ticket_verifications already exists, skipping creation');
    return;
  }
  
  // Create the ticket_verifications table
  const { error } = await supabase.rpc('create_ticket_verifications_table', {});
  
  if (error) {
    console.error('Error creating ticket_verifications table:', error);
    throw error;
  }
  
  console.log('Successfully created ticket_verifications table');
}

export async function setupTicketVerificationsRPC() {
  const supabase = createClient();
  
  // Create the stored procedure for creating the table
  const createTableProcedure = `
    CREATE OR REPLACE FUNCTION create_ticket_verifications_table()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      CREATE TABLE IF NOT EXISTS public.ticket_verifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        registration_id UUID NOT NULL REFERENCES public.registrations(id),
        verified_by UUID NOT NULL REFERENCES public.profiles(id),
        status TEXT NOT NULL CHECK (status IN ('verified', 'rejected')),
        notes TEXT,
        verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Add indexes for performance
      CREATE INDEX IF NOT EXISTS idx_ticket_verifications_registration_id ON public.ticket_verifications(registration_id);
      CREATE INDEX IF NOT EXISTS idx_ticket_verifications_verified_by ON public.ticket_verifications(verified_by);
      CREATE INDEX IF NOT EXISTS idx_ticket_verifications_status ON public.ticket_verifications(status);
      CREATE INDEX IF NOT EXISTS idx_ticket_verifications_verified_at ON public.ticket_verifications(verified_at);
      
      -- Set up row level security
      ALTER TABLE public.ticket_verifications ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      -- Allow authenticated users to view verifications for events they manage
      DROP POLICY IF EXISTS "Event managers can view ticket verifications" ON public.ticket_verifications;
      CREATE POLICY "Event managers can view ticket verifications"
      ON public.ticket_verifications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.registrations r
          JOIN public.events e ON r.event_id = e.id
          WHERE r.id = registration_id AND e.organizer_id = auth.uid()
        )
      );
      
      -- Allow authenticated users to create verifications for events they manage
      DROP POLICY IF EXISTS "Event managers can create ticket verifications" ON public.ticket_verifications;
      CREATE POLICY "Event managers can create ticket verifications"
      ON public.ticket_verifications
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.registrations r
          JOIN public.events e ON r.event_id = e.id
          WHERE r.id = registration_id AND e.organizer_id = auth.uid()
        )
      );
      
      -- Allow users to view their own ticket verifications
      DROP POLICY IF EXISTS "Users can view their own ticket verifications" ON public.ticket_verifications;
      CREATE POLICY "Users can view their own ticket verifications"
      ON public.ticket_verifications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.registrations r
          WHERE r.id = registration_id AND r.user_id = auth.uid()
        )
      );
      
      -- Allow volunteers to create verifications for assigned events
      DROP POLICY IF EXISTS "Volunteers can create verifications for assigned events" ON public.ticket_verifications;
      CREATE POLICY "Volunteers can create verifications for assigned events"
      ON public.ticket_verifications
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.volunteer_assignments va
          JOIN public.registrations r ON va.event_id = r.event_id
          WHERE r.id = registration_id 
            AND va.volunteer_id = verified_by 
            AND va.status = 'confirmed'
        )
      );
      
      -- Set up triggers for updated_at
      DROP TRIGGER IF EXISTS set_ticket_verifications_updated_at ON public.ticket_verifications;
      CREATE TRIGGER set_ticket_verifications_updated_at
      BEFORE UPDATE ON public.ticket_verifications
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
    END;
    $$;
  `;
  
  const { error: procError } = await supabase.rpc('exec_sql', { sql: createTableProcedure });
  
  if (procError) {
    console.error('Error creating ticket_verifications stored procedure:', procError);
    throw procError;
  }
  
  console.log('Successfully created ticket_verifications stored procedure');
}

export async function runMigration() {
  try {
    await setupTicketVerificationsRPC();
    await createTicketVerificationsTable();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// If running the script directly
if (typeof require !== 'undefined' && require.main === module) {
  runMigration().catch(console.error);
} 