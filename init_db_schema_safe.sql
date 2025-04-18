-- MIGRATION: Initial Database Schema for Marathon Registration Platform (Safe Version)

-- Create ENUM types if they don't exist
DO $$
BEGIN
    -- Create user_role enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('organizer', 'runner', 'volunteer');
    END IF;
    
    -- Create event_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_status') THEN
        CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');
    END IF;
    
    -- Create ticket_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('active', 'sold_out', 'disabled');
    END IF;
    
    -- Create registration_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_status') THEN
        CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'checked_in');
    END IF;
    
    -- Create payment_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
    END IF;
    
    -- Create verification_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_type') THEN
        CREATE TYPE verification_type AS ENUM ('aadhaar', 'email', 'phone');
    END IF;
    
    -- Create verification_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed');
    END IF;
    
    -- Create gender_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('male', 'female', 'non-binary', 'prefer_not_to_say');
    END IF;
    
    -- Create blood_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_type') THEN
        CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown');
    END IF;
    
    -- Create experience_level_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level_type') THEN
        CREATE TYPE experience_level_type AS ENUM ('beginner', 'intermediate', 'advanced', 'professional');
    END IF;
    
    -- Create tshirt_size enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tshirt_size') THEN
        CREATE TYPE tshirt_size AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');
    END IF;
END$$;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'runner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status event_status NOT NULL DEFAULT 'draft',
  banner_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT events_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 255),
  CONSTRAINT events_date_in_future CHECK (event_date > NOW())
);

-- Create tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  max_per_user INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status ticket_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT tickets_price CHECK (price >= 0),
  CONSTRAINT tickets_quantity CHECK (quantity > 0),
  CONSTRAINT tickets_max_per_user CHECK (max_per_user > 0),
  CONSTRAINT tickets_date_range CHECK (start_date < end_date)
);

-- Create registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status registration_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  qr_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT registrations_unique_user_ticket UNIQUE (user_id, ticket_id)
);

-- Create verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type verification_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT verifications_unique_user_type UNIQUE (user_id, type)
);

-- Create runner_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS runner_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender gender_type,
  medical_conditions TEXT,
  allergies TEXT,
  medications TEXT,
  blood_type blood_type,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  experience_level experience_level_type,
  years_running INTEGER,
  previous_marathons INTEGER,
  average_pace TEXT,
  preferred_distance TEXT[],
  running_goals TEXT,
  t_shirt_size tshirt_size,
  profile_image_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create run_statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS run_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,
  event_date DATE NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  time_seconds INTEGER NOT NULL,
  pace_per_km DECIMAL(10, 2) NOT NULL,
  elevation_gain DECIMAL(10, 2) DEFAULT 0,
  average_heart_rate INTEGER,
  notes TEXT,
  achievements JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$
BEGIN
    -- Create event indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_organizer') THEN
        CREATE INDEX idx_events_organizer ON events(organizer_id);
    END IF;
    
    -- Create ticket indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tickets_event') THEN
        CREATE INDEX idx_tickets_event ON tickets(event_id);
    END IF;
    
    -- Create registration indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_registrations_user') THEN
        CREATE INDEX idx_registrations_user ON registrations(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_registrations_event') THEN
        CREATE INDEX idx_registrations_event ON registrations(event_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_registrations_ticket') THEN
        CREATE INDEX idx_registrations_ticket ON registrations(ticket_id);
    END IF;
    
    -- Create verification indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_verifications_user') THEN
        CREATE INDEX idx_verifications_user ON verifications(user_id);
    END IF;
    
    -- Create run statistics indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_run_statistics_user') THEN
        CREATE INDEX idx_run_statistics_user ON run_statistics(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_run_statistics_event') THEN
        CREATE INDEX idx_run_statistics_event ON run_statistics(event_id);
    END IF;
END$$;

-- Set up Row Level Security (RLS)
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE runner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_statistics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS users_select_all ON users;
DROP POLICY IF EXISTS users_insert_self ON users;
DROP POLICY IF EXISTS users_update_self ON users;

DROP POLICY IF EXISTS events_select_published ON events;
DROP POLICY IF EXISTS events_insert_organizer ON events;
DROP POLICY IF EXISTS events_update_organizer ON events;
DROP POLICY IF EXISTS events_delete_organizer ON events;

DROP POLICY IF EXISTS tickets_select_all ON tickets;
DROP POLICY IF EXISTS tickets_insert_organizer ON tickets;
DROP POLICY IF EXISTS tickets_update_organizer ON tickets;
DROP POLICY IF EXISTS tickets_delete_organizer ON tickets;

DROP POLICY IF EXISTS registrations_select_own ON registrations;
DROP POLICY IF EXISTS registrations_insert_own ON registrations;
DROP POLICY IF EXISTS registrations_update_own_or_organizer ON registrations;

DROP POLICY IF EXISTS verifications_select_own ON verifications;
DROP POLICY IF EXISTS verifications_insert_own ON verifications;
DROP POLICY IF EXISTS verifications_update_own ON verifications;

DROP POLICY IF EXISTS runner_profiles_select_own ON runner_profiles;
DROP POLICY IF EXISTS runner_profiles_insert_own ON runner_profiles;
DROP POLICY IF EXISTS runner_profiles_update_own ON runner_profiles;

DROP POLICY IF EXISTS run_statistics_select_own ON run_statistics;
DROP POLICY IF EXISTS run_statistics_insert_own ON run_statistics;
DROP POLICY IF EXISTS run_statistics_update_own ON run_statistics;

-- RLS Policies for users
CREATE POLICY users_select_all ON users FOR SELECT USING (true);
CREATE POLICY users_insert_self ON users FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY users_update_self ON users FOR UPDATE USING (auth.uid() = auth_id);

-- RLS Policies for events
CREATE POLICY events_select_published ON events FOR SELECT USING (status = 'published' OR auth.uid() IN (
  SELECT auth_id FROM users WHERE id = events.organizer_id
));
CREATE POLICY events_insert_organizer ON events FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = organizer_id AND role = 'organizer')
);
CREATE POLICY events_update_organizer ON events FOR UPDATE USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = organizer_id AND role = 'organizer')
);
CREATE POLICY events_delete_organizer ON events FOR DELETE USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = organizer_id AND role = 'organizer')
);

-- RLS Policies for tickets
CREATE POLICY tickets_select_all ON tickets FOR SELECT USING (true);
CREATE POLICY tickets_insert_organizer ON tickets FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT u.auth_id 
    FROM users u 
    JOIN events e ON u.id = e.organizer_id 
    WHERE e.id = event_id AND u.role = 'organizer'
  )
);
CREATE POLICY tickets_update_organizer ON tickets FOR UPDATE USING (
  auth.uid() IN (
    SELECT u.auth_id 
    FROM users u 
    JOIN events e ON u.id = e.organizer_id 
    WHERE e.id = event_id AND u.role = 'organizer'
  )
);
CREATE POLICY tickets_delete_organizer ON tickets FOR DELETE USING (
  auth.uid() IN (
    SELECT u.auth_id 
    FROM users u 
    JOIN events e ON u.id = e.organizer_id 
    WHERE e.id = event_id AND u.role = 'organizer'
  )
);

-- RLS Policies for registrations
CREATE POLICY registrations_select_own ON registrations FOR SELECT USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
  OR auth.uid() IN (
    SELECT u.auth_id 
    FROM users u 
    JOIN events e ON u.id = e.organizer_id 
    WHERE e.id = event_id AND u.role = 'organizer'
  )
);
CREATE POLICY registrations_insert_own ON registrations FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);
CREATE POLICY registrations_update_own_or_organizer ON registrations FOR UPDATE USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
  OR auth.uid() IN (
    SELECT u.auth_id 
    FROM users u 
    JOIN events e ON u.id = e.organizer_id 
    WHERE e.id = event_id AND u.role = 'organizer'
  )
);

-- RLS Policies for verifications
CREATE POLICY verifications_select_own ON verifications FOR SELECT USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);
CREATE POLICY verifications_insert_own ON verifications FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);
CREATE POLICY verifications_update_own ON verifications FOR UPDATE USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);

-- RLS Policies for runner profiles
CREATE POLICY runner_profiles_select_own ON runner_profiles FOR SELECT USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = runner_profiles.id)
);
CREATE POLICY runner_profiles_insert_own ON runner_profiles FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = runner_profiles.id)
);
CREATE POLICY runner_profiles_update_own ON runner_profiles FOR UPDATE USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = runner_profiles.id)
);

-- RLS Policies for run statistics
CREATE POLICY run_statistics_select_own ON run_statistics FOR SELECT USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);
CREATE POLICY run_statistics_insert_own ON run_statistics FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);
CREATE POLICY run_statistics_update_own ON run_statistics FOR UPDATE USING (
  auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id)
);

-- Enable realtime subscriptions for relevant tables (safe version)
BEGIN;
DO $$
DECLARE
  realtime_exists BOOLEAN;
  table_in_publication BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) INTO realtime_exists;

  IF realtime_exists THEN
    -- Check if tables are in the publication
    SELECT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'events'
    ) INTO table_in_publication;

    IF NOT table_in_publication THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE events;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'registrations'
    ) INTO table_in_publication;

    IF NOT table_in_publication THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tickets'
    ) INTO table_in_publication;

    IF NOT table_in_publication THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
    END IF;
  END IF;
END$$;
COMMIT; 