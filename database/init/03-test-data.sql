-- Insert test user in auth.users
INSERT INTO auth.users (id, email, encrypted_password) 
VALUES 
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'test@example.com', 'mock-password')
ON CONFLICT (id) DO NOTHING;

-- Insert test users
INSERT INTO users (id, auth_id, email, first_name, last_name, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'test@example.com', 'Test', 'User', 'organizer'),
  ('22222222-2222-2222-2222-222222222222', NULL, 'runner@example.com', 'Runner', 'User', 'runner'),
  ('33333333-3333-3333-3333-333333333333', NULL, 'volunteer@example.com', 'Volunteer', 'User', 'volunteer')
ON CONFLICT (id) DO NOTHING;

-- Insert test event
INSERT INTO events (id, title, description, event_date, location, organizer_id, status)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Test Marathon', 'A test marathon event', NOW() + INTERVAL '30 days', 'Test City', '11111111-1111-1111-1111-111111111111', 'published')
ON CONFLICT (id) DO NOTHING;

-- Insert test tickets
INSERT INTO tickets (id, event_id, name, description, price, quantity, max_per_user, start_date, end_date)
VALUES
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Standard Entry', 'Standard marathon entry', 50.00, 100, 1, NOW(), NOW() + INTERVAL '20 days'),
  ('66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 'VIP Entry', 'VIP marathon entry with extras', 100.00, 20, 1, NOW(), NOW() + INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- Insert test registration
INSERT INTO registrations (id, user_id, event_id, ticket_id, status, payment_status)
VALUES
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'confirmed', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Insert test verification
INSERT INTO verifications (id, user_id, type, status)
VALUES
  ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'email', 'verified')
ON CONFLICT (id) DO NOTHING; 