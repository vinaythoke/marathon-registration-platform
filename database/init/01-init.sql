-- Enable necessary extensions for Supabase compatibility
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema (simulates Supabase auth)
CREATE SCHEMA IF NOT EXISTS auth;

-- Create storage schema (simulates Supabase storage)
CREATE SCHEMA IF NOT EXISTS storage;

-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Create a simplified auth.users table to simulate Supabase Auth
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add function to simulate Supabase's auth.uid() function
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
BEGIN
  -- In development, you can return a fixed UUID for testing
  -- This would be replaced by the actual user's UUID in your app logic
  RETURN 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::UUID;
END;
$$ LANGUAGE plpgsql; 