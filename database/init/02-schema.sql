-- Create user roles enum
CREATE TYPE user_role AS ENUM ('organizer', 'runner', 'volunteer');

-- Create event status enum
CREATE TYPE event_status AS ENUM ('draft', 'published', 'cancelled', 'completed');

-- Create ticket status enum
CREATE TYPE ticket_status AS ENUM ('active', 'sold_out', 'disabled');

-- Create registration status enum
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'checked_in');

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Create verification type enum
CREATE TYPE verification_type AS ENUM ('aadhaar', 'email', 'phone');

-- Create verification status enum
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'failed');

-- Create users table with Row-Level Security
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'runner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create events table with Row-Level Security
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status event_status NOT NULL DEFAULT 'draft',
  banner_url TEXT,
  
  CONSTRAINT events_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 255),
  CONSTRAINT events_date_in_future CHECK (event_date > NOW())
);

-- Create tickets table with Row-Level Security
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  max_per_user INTEGER NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status ticket_status NOT NULL DEFAULT 'active',
  
  CONSTRAINT tickets_price CHECK (price >= 0),
  CONSTRAINT tickets_quantity CHECK (quantity > 0),
  CONSTRAINT tickets_max_per_user CHECK (max_per_user > 0),
  CONSTRAINT tickets_date_range CHECK (start_date < end_date)
);

-- Create registrations table with Row-Level Security
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status registration_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_code TEXT,
  
  CONSTRAINT registrations_unique_user_ticket UNIQUE (user_id, ticket_id)
);

-- Create verifications table with Row-Level Security
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type verification_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  
  CONSTRAINT verifications_unique_user_type UNIQUE (user_id, type)
);

-- Create indexes for performance
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_ticket ON registrations(ticket_id);
CREATE INDEX idx_verifications_user ON verifications(user_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Users RLS Policies
-- Everyone can read public user profiles
CREATE POLICY users_read ON users
  FOR SELECT USING (TRUE);

-- Users can update their own profiles
CREATE POLICY users_update ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- Events RLS Policies
-- Everyone can read published events
CREATE POLICY events_read_published ON events
  FOR SELECT USING (status = 'published');

-- Organizers can read all their events
CREATE POLICY events_read_own ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = events.organizer_id
      AND users.auth_id = auth.uid()
      AND users.role = 'organizer'
    )
  );

-- Simplified policy for testing
CREATE POLICY events_all_access ON events
  FOR ALL USING (TRUE);

-- Simplified access for all other tables during development
CREATE POLICY tickets_all_access ON tickets
  FOR ALL USING (TRUE);

CREATE POLICY registrations_all_access ON registrations
  FOR ALL USING (TRUE);

CREATE POLICY verifications_all_access ON verifications
  FOR ALL USING (TRUE); 