-- MIGRATION: Seed Data for Marathon Registration Platform (Safe Version)

-- This script will insert sample data for testing while handling possible conflicts
-- It checks if records exist before attempting to insert them

-- Function to safely insert data
CREATE OR REPLACE FUNCTION safe_insert(check_query text, insert_query text) RETURNS void AS $$
DECLARE
  record_exists boolean;
BEGIN
  EXECUTE check_query INTO record_exists;
  IF NOT record_exists THEN
    EXECUTE insert_query;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Sample users: Test Accounts 
-- Create organizer users
DO $$
BEGIN
  -- Insert first organizer if not exists
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM users WHERE id = ''00000000-0000-0000-0000-000000000001'')',
    'INSERT INTO users (id, auth_id, email, first_name, last_name, role) VALUES
     (''00000000-0000-0000-0000-000000000001'', ''00000000-0000-0000-0000-000000000001'', ''organizer1@example.com'', ''John'', ''Organizer'', ''organizer'')'
  );
  
  -- Insert second organizer if not exists
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM users WHERE id = ''00000000-0000-0000-0000-000000000002'')',
    'INSERT INTO users (id, auth_id, email, first_name, last_name, role) VALUES
     (''00000000-0000-0000-0000-000000000002'', ''00000000-0000-0000-0000-000000000002'', ''organizer2@example.com'', ''Jane'', ''Event'', ''organizer'')'
  );
  
  -- Insert runner users if not exists
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM users WHERE id = ''00000000-0000-0000-0000-000000000003'')',
    'INSERT INTO users (id, auth_id, email, first_name, last_name, role) VALUES
     (''00000000-0000-0000-0000-000000000003'', ''00000000-0000-0000-0000-000000000003'', ''runner1@example.com'', ''Mike'', ''Runner'', ''runner'')'
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM users WHERE id = ''00000000-0000-0000-0000-000000000004'')',
    'INSERT INTO users (id, auth_id, email, first_name, last_name, role) VALUES
     (''00000000-0000-0000-0000-000000000004'', ''00000000-0000-0000-0000-000000000004'', ''runner2@example.com'', ''Sarah'', ''Fast'', ''runner'')'
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM users WHERE id = ''00000000-0000-0000-0000-000000000005'')',
    'INSERT INTO users (id, auth_id, email, first_name, last_name, role) VALUES
     (''00000000-0000-0000-0000-000000000005'', ''00000000-0000-0000-0000-000000000005'', ''runner3@example.com'', ''David'', ''Marathon'', ''runner'')'
  );
  
  -- Insert volunteer users if not exists
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM users WHERE id = ''00000000-0000-0000-0000-000000000006'')',
    'INSERT INTO users (id, auth_id, email, first_name, last_name, role) VALUES
     (''00000000-0000-0000-0000-000000000006'', ''00000000-0000-0000-0000-000000000006'', ''volunteer1@example.com'', ''Lisa'', ''Helper'', ''volunteer'')'
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM users WHERE id = ''00000000-0000-0000-0000-000000000007'')',
    'INSERT INTO users (id, auth_id, email, first_name, last_name, role) VALUES
     (''00000000-0000-0000-0000-000000000007'', ''00000000-0000-0000-0000-000000000007'', ''volunteer2@example.com'', ''Tom'', ''Assist'', ''volunteer'')'
  );
END$$;

-- Create runner profiles if they don't exist
DO $$
BEGIN
  -- First runner profile
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM runner_profiles WHERE id = ''00000000-0000-0000-0000-000000000003'')',
    $RUNNER1$
    INSERT INTO runner_profiles (
      id, address, city, state, postal_code, country, phone, date_of_birth, gender, 
      medical_conditions, allergies, blood_type, emergency_contact_name, 
      emergency_contact_phone, emergency_contact_relationship, experience_level, 
      years_running, previous_marathons, average_pace, preferred_distance, 
      running_goals, t_shirt_size, profile_image_url, bio
    ) VALUES (
      '00000000-0000-0000-0000-000000000003',
      '123 Runner St', 'Chicago', 'IL', '60601', 'USA', '+1234567890',
      '1990-05-15', 'male', 'None', 'None', 'O+',
      'Emergency Contact 1', '+1987654321', 'Spouse',
      'intermediate', 5, 3, '5:30 min/km',
      ARRAY['10K', 'Half Marathon', 'Marathon'],
      'Complete a marathon under 4 hours', 'M',
      'https://example.com/profile1.jpg',
      'Passionate runner looking to improve marathon times.'
    )
    $RUNNER1$
  );
  
  -- Second runner profile
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM runner_profiles WHERE id = ''00000000-0000-0000-0000-000000000004'')',
    $RUNNER2$
    INSERT INTO runner_profiles (
      id, address, city, state, postal_code, country, phone, date_of_birth, gender, 
      medical_conditions, allergies, blood_type, emergency_contact_name, 
      emergency_contact_phone, emergency_contact_relationship, experience_level, 
      years_running, previous_marathons, average_pace, preferred_distance, 
      running_goals, t_shirt_size, profile_image_url, bio
    ) VALUES (
      '00000000-0000-0000-0000-000000000004',
      '456 Sprint Ave', 'New York', 'NY', '10001', 'USA', '+1122334455',
      '1992-08-22', 'female', 'None', 'Peanuts', 'A-',
      'Emergency Contact 2', '+1555666777', 'Parent',
      'advanced', 8, 6, '4:45 min/km',
      ARRAY['5K', '10K', 'Half Marathon', 'Marathon'],
      'Qualify for Boston Marathon', 'S',
      'https://example.com/profile2.jpg',
      'Competitive runner with several podium finishes.'
    )
    $RUNNER2$
  );
  
  -- Third runner profile
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM runner_profiles WHERE id = ''00000000-0000-0000-0000-000000000005'')',
    $RUNNER3$
    INSERT INTO runner_profiles (
      id, address, city, state, postal_code, country, phone, date_of_birth, gender, 
      medical_conditions, allergies, blood_type, emergency_contact_name, 
      emergency_contact_phone, emergency_contact_relationship, experience_level, 
      years_running, previous_marathons, average_pace, preferred_distance, 
      running_goals, t_shirt_size, profile_image_url, bio
    ) VALUES (
      '00000000-0000-0000-0000-000000000005',
      '789 Marathon Blvd', 'Boston', 'MA', '02108', 'USA', '+1777888999',
      '1985-11-10', 'male', 'None', 'None', 'B+',
      'Emergency Contact 3', '+1333222111', 'Sibling',
      'beginner', 2, 0, '6:15 min/km',
      ARRAY['5K', '10K'],
      'Complete first marathon', 'L',
      'https://example.com/profile3.jpg',
      'New to running, excited to challenge myself with longer distances.'
    )
    $RUNNER3$
  );
END$$;

-- Create events if they don't exist
DO $$
BEGIN
  -- Chicago Spring Marathon
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM events WHERE id = ''00000000-0000-0000-0000-000000000010'')',
    $EVENT1$
    INSERT INTO events (
      id, title, description, event_date, location, organizer_id, 
      status, banner_url
    ) VALUES (
      '00000000-0000-0000-0000-000000000010',
      'Chicago Spring Marathon',
      'Join us for the annual Chicago Spring Marathon! Beautiful route through downtown Chicago and along the waterfront.',
      NOW() + INTERVAL '30 days',
      'Chicago, IL',
      '00000000-0000-0000-0000-000000000001',
      'published',
      'https://example.com/chicago_marathon.jpg'
    )
    $EVENT1$
  );
  
  -- New York City Half Marathon
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM events WHERE id = ''00000000-0000-0000-0000-000000000011'')',
    $EVENT2$
    INSERT INTO events (
      id, title, description, event_date, location, organizer_id, 
      status, banner_url
    ) VALUES (
      '00000000-0000-0000-0000-000000000011',
      'New York City Half Marathon',
      'Experience the vibrant energy of NYC in this scenic half marathon through Manhattan.',
      NOW() + INTERVAL '60 days',
      'New York, NY',
      '00000000-0000-0000-0000-000000000002',
      'published',
      'https://example.com/nyc_half.jpg'
    )
    $EVENT2$
  );
  
  -- Boston Fall 10K
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM events WHERE id = ''00000000-0000-0000-0000-000000000012'')',
    $EVENT3$
    INSERT INTO events (
      id, title, description, event_date, location, organizer_id, 
      status, banner_url
    ) VALUES (
      '00000000-0000-0000-0000-000000000012',
      'Boston Fall 10K',
      'A beautiful fall run through historic Boston with scenic views of the Charles River.',
      NOW() + INTERVAL '90 days',
      'Boston, MA',
      '00000000-0000-0000-0000-000000000001',
      'published',
      'https://example.com/boston_10k.jpg'
    )
    $EVENT3$
  );
  
  -- Mountain Trail Run
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM events WHERE id = ''00000000-0000-0000-0000-000000000013'')',
    $EVENT4$
    INSERT INTO events (
      id, title, description, event_date, location, organizer_id, 
      status, banner_url
    ) VALUES (
      '00000000-0000-0000-0000-000000000013',
      'Mountain Trail Run',
      'Challenge yourself with this demanding trail run through beautiful mountain terrain.',
      NOW() + INTERVAL '45 days',
      'Denver, CO',
      '00000000-0000-0000-0000-000000000002',
      'published',
      'https://example.com/mountain_trail.jpg'
    )
    $EVENT4$
  );
  
  -- Charity 5K Fun Run
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM events WHERE id = ''00000000-0000-0000-0000-000000000014'')',
    $EVENT5$
    INSERT INTO events (
      id, title, description, event_date, location, organizer_id, 
      status, banner_url
    ) VALUES (
      '00000000-0000-0000-0000-000000000014',
      'Charity 5K Fun Run',
      'Run for a cause! All proceeds go to local children''s hospitals.',
      NOW() + INTERVAL '15 days',
      'San Francisco, CA',
      '00000000-0000-0000-0000-000000000001',
      'published',
      'https://example.com/charity_5k.jpg'
    )
    $EVENT5$
  );
  
  -- Upcoming Winter Marathon (draft)
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM events WHERE id = ''00000000-0000-0000-0000-000000000015'')',
    $EVENT6$
    INSERT INTO events (
      id, title, description, event_date, location, organizer_id, 
      status, banner_url
    ) VALUES (
      '00000000-0000-0000-0000-000000000015',
      'Upcoming Winter Marathon',
      'Draft event for the upcoming winter marathon. Details to be finalized.',
      NOW() + INTERVAL '120 days',
      'Chicago, IL',
      '00000000-0000-0000-0000-000000000001',
      'draft',
      NULL
    )
    $EVENT6$
  );
END$$;

-- Create tickets for events if they don't exist
DO $$
BEGIN
  -- Chicago Spring Marathon tickets
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ''00000000-0000-0000-0000-000000000020'')',
    $TICKET1$
    INSERT INTO tickets (
      id, event_id, name, description, price, quantity, 
      max_per_user, start_date, end_date, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000020',
      '00000000-0000-0000-0000-000000000010',
      'Early Bird Marathon Entry',
      'Discounted early bird registration for the full marathon.',
      75.00, 200, 1,
      NOW() - INTERVAL '60 days',
      NOW() + INTERVAL '15 days',
      'active'
    )
    $TICKET1$
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ''00000000-0000-0000-0000-000000000021'')',
    $TICKET2$
    INSERT INTO tickets (
      id, event_id, name, description, price, quantity, 
      max_per_user, start_date, end_date, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000021',
      '00000000-0000-0000-0000-000000000010',
      'Regular Marathon Entry',
      'Standard registration for the full marathon.',
      95.00, 500, 1,
      NOW() - INTERVAL '30 days',
      NOW() + INTERVAL '25 days',
      'active'
    )
    $TICKET2$
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ''00000000-0000-0000-0000-000000000022'')',
    $TICKET3$
    INSERT INTO tickets (
      id, event_id, name, description, price, quantity, 
      max_per_user, start_date, end_date, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000022',
      '00000000-0000-0000-0000-000000000010',
      'VIP Marathon Experience',
      'Premium marathon experience with special perks and exclusive swag.',
      150.00, 50, 1,
      NOW() - INTERVAL '60 days',
      NOW() + INTERVAL '20 days',
      'active'
    )
    $TICKET3$
  );
  
  -- NYC Half Marathon tickets
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ''00000000-0000-0000-0000-000000000023'')',
    $TICKET4$
    INSERT INTO tickets (
      id, event_id, name, description, price, quantity, 
      max_per_user, start_date, end_date, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000023',
      '00000000-0000-0000-0000-000000000011',
      'Half Marathon Entry',
      'Standard entry for the NYC Half Marathon.',
      65.00, 1000, 1,
      NOW() - INTERVAL '45 days',
      NOW() + INTERVAL '45 days',
      'active'
    )
    $TICKET4$
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ''00000000-0000-0000-0000-000000000024'')',
    $TICKET5$
    INSERT INTO tickets (
      id, event_id, name, description, price, quantity, 
      max_per_user, start_date, end_date, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000024',
      '00000000-0000-0000-0000-000000000011',
      'Charity Half Marathon Entry',
      'Run for a cause - portion of registration fee goes to charity.',
      80.00, 200, 1,
      NOW() - INTERVAL '45 days',
      NOW() + INTERVAL '45 days',
      'active'
    )
    $TICKET5$
  );
  
  -- More tickets for other events
  -- Only showing a few examples for brevity, the pattern is the same for all
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ''00000000-0000-0000-0000-000000000025'')',
    $TICKET6$
    INSERT INTO tickets (
      id, event_id, name, description, price, quantity, 
      max_per_user, start_date, end_date, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000025',
      '00000000-0000-0000-0000-000000000012',
      'Standard 10K Entry',
      'Regular entry for the Boston Fall 10K.',
      45.00, 1500, 1,
      NOW() - INTERVAL '30 days',
      NOW() + INTERVAL '75 days',
      'active'
    )
    $TICKET6$
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ''00000000-0000-0000-0000-000000000029'')',
    $TICKET10$
    INSERT INTO tickets (
      id, event_id, name, description, price, quantity, 
      max_per_user, start_date, end_date, status
    ) VALUES (
      '00000000-0000-0000-0000-000000000029',
      '00000000-0000-0000-0000-000000000014',
      'Charity 5K Entry',
      'Standard entry for the charity fun run.',
      25.00, 2000, 5,
      NOW() - INTERVAL '45 days',
      NOW() + INTERVAL '10 days',
      'active'
    )
    $TICKET10$
  );
END$$;

-- Create verifications if they don't exist
DO $$
BEGIN
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM verifications WHERE id = ''00000000-0000-0000-0000-000000000040'')',
    $VERIFY1$
    INSERT INTO verifications (
      id, user_id, type, status, verified_at, metadata
    ) VALUES (
      '00000000-0000-0000-0000-000000000040',
      '00000000-0000-0000-0000-000000000003',
      'email',
      'verified',
      NOW() - INTERVAL '60 days',
      '{"verification_method": "code", "verification_code": "123456"}'
    )
    $VERIFY1$
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM verifications WHERE id = ''00000000-0000-0000-0000-000000000041'')',
    $VERIFY2$
    INSERT INTO verifications (
      id, user_id, type, status, verified_at, metadata
    ) VALUES (
      '00000000-0000-0000-0000-000000000041',
      '00000000-0000-0000-0000-000000000004',
      'email',
      'verified',
      NOW() - INTERVAL '45 days',
      '{"verification_method": "code", "verification_code": "789012"}'
    )
    $VERIFY2$
  );
END$$;

-- Create registrations if they don't exist
DO $$
BEGIN
  -- Runner 1 registrations
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM registrations WHERE id = ''00000000-0000-0000-0000-000000000050'')',
    $REG1$
    INSERT INTO registrations (
      id, user_id, event_id, ticket_id, status, payment_status, 
      transaction_id, qr_code, created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000050',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000010',
      '00000000-0000-0000-0000-000000000020',
      'confirmed',
      'completed',
      'TXN123456789',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      NOW() - INTERVAL '50 days'
    )
    $REG1$
  );
  
  -- Runner 2 registrations (just a sample)
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM registrations WHERE id = ''00000000-0000-0000-0000-000000000052'')',
    $REG3$
    INSERT INTO registrations (
      id, user_id, event_id, ticket_id, status, payment_status, 
      transaction_id, qr_code, created_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000052',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000011',
      '00000000-0000-0000-0000-000000000023',
      'confirmed',
      'completed',
      'TXN567891234',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      NOW() - INTERVAL '40 days'
    )
    $REG3$
  );
END$$;

-- Create statistics for completed runs if they don't exist
DO $$
BEGIN
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM run_statistics WHERE id = ''00000000-0000-0000-0000-000000000060'')',
    $STAT1$
    INSERT INTO run_statistics (
      id, user_id, event_id, registration_id, event_date,
      distance, time_seconds, pace_per_km, elevation_gain,
      average_heart_rate, notes, achievements, metadata
    ) VALUES (
      '00000000-0000-0000-0000-000000000060',
      '00000000-0000-0000-0000-000000000003',
      NULL,
      NULL,
      NOW() - INTERVAL '60 days',
      10.0,
      3000,
      5.0,
      120.5,
      165,
      'Great training run, felt strong throughout.',
      '{"medals": ["10K Completed", "Personal Best"]}',
      '{"weather": "Sunny", "temperature": 22, "humidity": 65}'
    )
    $STAT1$
  );
  
  PERFORM safe_insert(
    'SELECT EXISTS(SELECT 1 FROM run_statistics WHERE id = ''00000000-0000-0000-0000-000000000061'')',
    $STAT2$
    INSERT INTO run_statistics (
      id, user_id, event_id, registration_id, event_date,
      distance, time_seconds, pace_per_km, elevation_gain,
      average_heart_rate, notes, achievements, metadata
    ) VALUES (
      '00000000-0000-0000-0000-000000000061',
      '00000000-0000-0000-0000-000000000004',
      NULL,
      NULL,
      NOW() - INTERVAL '30 days',
      21.1,
      5940,
      4.7,
      250.3,
      172,
      'Half marathon training run. Maintained good pace.',
      '{"medals": ["Half Marathon Completed"]}',
      '{"weather": "Cloudy", "temperature": 18, "humidity": 70}'
    )
    $STAT2$
  );
END$$;

-- Drop the helper function when done
DROP FUNCTION IF EXISTS safe_insert; 