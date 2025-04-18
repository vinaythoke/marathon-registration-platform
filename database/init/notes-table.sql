-- Create a function to ensure the notes table exists
CREATE OR REPLACE FUNCTION create_notes_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- Check if the table exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'notes'
  ) THEN
    -- Create the notes table
    CREATE TABLE public.notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ
    );

    -- Add indexes
    CREATE INDEX notes_user_id_idx ON public.notes(user_id);
    CREATE INDEX notes_created_at_idx ON public.notes(created_at);

    -- Enable Row Level Security
    ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view own notes" ON public.notes
      FOR SELECT USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can insert own notes" ON public.notes
      FOR INSERT WITH CHECK (auth.uid() = user_id);
      
    CREATE POLICY "Users can update own notes" ON public.notes
      FOR UPDATE USING (auth.uid() = user_id);
      
    CREATE POLICY "Users can delete own notes" ON public.notes
      FOR DELETE USING (auth.uid() = user_id);
      
    -- Grant permissions
    GRANT ALL ON public.notes TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE public.notes_id_seq TO authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql; 