-- Comprehensive test data for all areas of the Marathon Registration application
-- This script adds test data for all entities to support end-to-end testing

-- Clear existing test data first (if running multiple times)
DELETE FROM verifications;
DELETE FROM registrations;
DELETE FROM tickets;
DELETE FROM events;
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example%';

-- 1. Test Users (covering all roles)
INSERT INTO users (id, auth_id, email, first_name, last_name, role) 
VALUES 
  -- Organizers
  ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'org1@example.com', 'John', 'Organizer', 'organizer'),
  ('10000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'org2@example.com', 'Jane', 'Organizer', 'organizer'),
  
  -- Runners
  ('20000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'runner1@example.com', 'Alex', 'Runner', 'runner'),
  ('20000000-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444', 'runner2@example.com', 'Sam', 'Runner', 'runner'),
  ('20000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 'runner3@example.com', 'Pat', 'Runner', 'runner'),
  ('20000000-0000-0000-0000-000000000004', '66666666-6666-6666-6666-666666666666', 'runner4@example.com', 'Morgan', 'Runner', 'runner'),
  ('20000000-0000-0000-0000-000000000005', '77777777-7777-7777-7777-777777777777', 'runner5@example.com', 'Jamie', 'Runner', 'runner'),
  
  -- Volunteers
  ('30000000-0000-0000-0000-000000000001', '88888888-8888-8888-8888-888888888888', 'vol1@example.com', 'Taylor', 'Volunteer', 'volunteer'),
  ('30000000-0000-0000-0000-000000000002', '99999999-9999-9999-9999-999999999999', 'vol2@example.com', 'Riley', 'Volunteer', 'volunteer'),
  ('30000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'vol3@example.com', 'Casey', 'Volunteer', 'volunteer');

-- 2. Events (with different statuses and dates)
INSERT INTO events (
  id, title, description, event_date, location, organizer_id,
  status, banner_url
)
VALUES
  -- Published events (upcoming)
  (
    '40000000-0000-0000-0000-000000000001',
    'Mumbai Marathon 2024',
    'Join us for the biggest marathon event in Mumbai. Multiple categories available including 5K, 10K, and full marathon.',
    NOW() + INTERVAL '30 days',
    'Mumbai, Maharashtra',
    '10000000-0000-0000-0000-000000000001',
    'published',
    'https://example.com/banners/mumbai-marathon-2024.jpg'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'Pune Half Marathon',
    'Experience the beautiful city of Pune in this half marathon event. Perfect for beginners and experienced runners alike.',
    NOW() + INTERVAL '60 days',
    'Pune, Maharashtra',
    '10000000-0000-0000-0000-000000000001',
    'published',
    'https://example.com/banners/pune-half-marathon.jpg'
  ),
  
  -- Draft event (for organizer testing)
  (
    '40000000-0000-0000-0000-000000000003',
    'Bangalore Trail Run',
    'Experience the thrill of trail running through scenic paths around Bangalore. Different difficulty levels available.',
    NOW() + INTERVAL '90 days',
    'Bangalore, Karnataka',
    '10000000-0000-0000-0000-000000000002',
    'draft',
    'https://example.com/banners/bangalore-trail.jpg'
  );

-- 3. Tickets for each event (with different prices, quantities, etc.)
INSERT INTO tickets (
  id, event_id, name, description, price,
  quantity, max_per_user, start_date, end_date, status
)
VALUES
  -- Mumbai Marathon tickets
  (
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    '5K Fun Run',
    'Entry ticket for beginner-friendly 5K category',
    500.00,
    1000,
    2,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    'active'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000001',
    '10K Run',
    'Entry ticket for intermediate 10K category',
    1000.00,
    800,
    1,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    'active'
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000001',
    'Half Marathon',
    'Entry ticket for half marathon (21.1 km)',
    1500.00,
    500,
    1,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    'active'
  ),
  (
    '50000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000001',
    'Full Marathon',
    'Entry ticket for full marathon (42.2 km)',
    2000.00,
    300,
    1,
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    'active'
  ),
  
  -- Pune Half Marathon tickets
  (
    '50000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000002',
    'Half Marathon - Early Bird',
    'Early bird discount for half marathon entry',
    1200.00,
    200,
    1,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '1 day',
    'sold_out'
  ),
  (
    '50000000-0000-0000-0000-000000000006',
    '40000000-0000-0000-0000-000000000002',
    'Half Marathon - Regular',
    'Regular entry for half marathon',
    1500.00,
    600,
    1,
    NOW(),
    NOW() + INTERVAL '30 days',
    'active'
  ),
  (
    '50000000-0000-0000-0000-000000000007',
    '40000000-0000-0000-0000-000000000002',
    '10K Run',
    'Entry for 10K run category',
    800.00,
    800,
    1,
    NOW(),
    NOW() + INTERVAL '30 days',
    'active'
  ),
  
  -- Bangalore Trail Run tickets (draft event)
  (
    '50000000-0000-0000-0000-000000000008',
    '40000000-0000-0000-0000-000000000003',
    'Beginner Trail',
    'Easy 5K trail for beginners',
    750.00,
    300,
    1,
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '60 days',
    'active'
  ),
  (
    '50000000-0000-0000-0000-000000000009',
    '40000000-0000-0000-0000-000000000003',
    'Advanced Trail',
    'Challenging 15K trail for experienced runners',
    1500.00,
    200,
    1,
    NOW() + INTERVAL '15 days',
    NOW() + INTERVAL '60 days',
    'active'
  );

-- 4. Registrations (with different statuses)
INSERT INTO registrations (
  id, user_id, event_id, ticket_id,
  status, payment_status, transaction_id, qr_code
)
VALUES
  -- Confirmed registrations (paid)
  (
    '60000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',  -- Alex Runner
    '40000000-0000-0000-0000-000000000001',  -- Mumbai Marathon
    '50000000-0000-0000-0000-000000000001',  -- 5K Fun Run
    'confirmed',
    'completed',
    'PAY_MM_5K_001',
    'https://example.com/qr/MM5K001'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',  -- Sam Runner
    '40000000-0000-0000-0000-000000000001',  -- Mumbai Marathon
    '50000000-0000-0000-0000-000000000003',  -- Half Marathon
    'confirmed',
    'completed',
    'PAY_MM_HM_001',
    'https://example.com/qr/MMHM001'
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000003',  -- Pat Runner
    '40000000-0000-0000-0000-000000000001',  -- Mumbai Marathon
    '50000000-0000-0000-0000-000000000004',  -- Full Marathon
    'confirmed',
    'completed',
    'PAY_MM_FM_001',
    'https://example.com/qr/MMFM001'
  ),
  
  -- Pending registration (payment pending)
  (
    '60000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000004',  -- Morgan Runner
    '40000000-0000-0000-0000-000000000002',  -- Pune Half Marathon
    '50000000-0000-0000-0000-000000000006',  -- Half Marathon - Regular
    'pending',
    'pending',
    NULL,
    NULL
  );

-- 5. Verifications (identity verification data)
INSERT INTO verifications (
  id, user_id, type, status,
  verified_at, metadata
)
VALUES
  -- Email verifications (for all users)
  (
    '70000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',  -- Alex Runner
    'email',
    'verified',
    NOW() - INTERVAL '30 days',
    '{"email": "runner1@example.com"}'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',  -- Sam Runner
    'email',
    'verified',
    NOW() - INTERVAL '25 days',
    '{"email": "runner2@example.com"}'
  ),
  
  -- Phone verifications
  (
    '70000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',  -- Alex Runner
    'phone',
    'verified',
    NOW() - INTERVAL '28 days',
    '{"phone": "+919876543001"}'
  ),
  (
    '70000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000003',  -- Pat Runner
    'phone',
    'pending',
    NULL,
    '{"phone": "+919876543003"}'
  ),
  
  -- Aadhaar verifications
  (
    '70000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000001',  -- Alex Runner
    'aadhaar',
    'verified',
    NOW() - INTERVAL '20 days',
    '{"aadhaar_number": "XXXX-XXXX-1001"}'
  ),
  (
    '70000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000002',  -- Sam Runner
    'aadhaar',
    'failed',
    NOW() - INTERVAL '15 days',
    '{"aadhaar_number": "XXXX-XXXX-1002", "failure_reason": "ID mismatch"}'
  );

-- 6. Runner profiles (extended information for runners)
-- Note: This is dependent on your schema, adjust if the schema differs
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'runner_profiles') THEN
        INSERT INTO runner_profiles (
            id, address, city, state, postal_code, country, phone, date_of_birth,
            gender, medical_conditions, allergies, blood_type,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
            experience_level, years_running, previous_marathons, average_pace,
            t_shirt_size, profile_image_url, bio
        )
        VALUES
        (
            '20000000-0000-0000-0000-000000000001',  -- Alex Runner
            '123 Runner Street', 'Mumbai', 'Maharashtra', '400001', 'India',
            '+919876543001', '1990-05-15',
            'male', 'None', 'None', 'O+',
            'Emergency Contact', '+919876543099', 'Parent',
            'intermediate', 3, 5, '5:30',
            'M', 'https://example.com/profile/alex.jpg',
            'Passionate runner with a focus on half marathons.'
        ),
        (
            '20000000-0000-0000-0000-000000000002',  -- Sam Runner
            '456 Marathon Road', 'Delhi', 'NCR', '110001', 'India',
            '+919876543002', '1992-08-22',
            'female', 'Asthma', 'Pollen', 'A+',
            'Emergency Person', '+919876543098', 'Spouse',
            'advanced', 5, 10, '4:45',
            'S', 'https://example.com/profile/sam.jpg',
            'Marathon enthusiast who loves challenging terrain.'
        );
    END IF;
END $$;

-- 7. Volunteer roles
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'volunteer_roles') THEN
        INSERT INTO volunteer_roles (
            id, name, description, event_id, required_volunteers,
            location, start_time, end_time, is_active
        )
        VALUES
        -- Volunteer roles for Mumbai Marathon
        (
            '90000000-0000-0000-0000-000000000001',
            'Registration Desk',
            'Manage runner check-in and packet pickup',
            '40000000-0000-0000-0000-000000000001',  -- Mumbai Marathon
            5,
            'Start Area', 
            (NOW() + INTERVAL '30 days' - INTERVAL '3 hours'),
            (NOW() + INTERVAL '30 days' - INTERVAL '30 minutes'),
            true
        ),
        (
            '90000000-0000-0000-0000-000000000002',
            'Water Station',
            'Distribute water to runners',
            '40000000-0000-0000-0000-000000000001',  -- Mumbai Marathon
            10,
            'Course KM 5', 
            (NOW() + INTERVAL '30 days' - INTERVAL '1 hour'),
            (NOW() + INTERVAL '30 days' + INTERVAL '5 hours'),
            true
        ),
        -- Volunteer roles for Pune Half Marathon
        (
            '90000000-0000-0000-0000-000000000003',
            'Medical Support',
            'Provide first aid assistance',
            '40000000-0000-0000-0000-000000000002',  -- Pune Half Marathon
            4,
            'Throughout Course', 
            (NOW() + INTERVAL '60 days' - INTERVAL '2 hours'),
            (NOW() + INTERVAL '60 days' + INTERVAL '5 hours'),
            true
        );
    END IF;
END $$;

-- 8. Volunteer assignments
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'volunteer_assignments') THEN
        INSERT INTO volunteer_assignments (
            id, volunteer_id, role_id, event_id, status, notes
        )
        VALUES
        (
            'a0000000-0000-0000-0000-000000000001',
            '30000000-0000-0000-0000-000000000001',  -- Taylor Volunteer
            '90000000-0000-0000-0000-000000000001',  -- Registration Desk
            '40000000-0000-0000-0000-000000000001',  -- Mumbai Marathon
            'confirmed',
            'Experienced with registration process'
        ),
        (
            'a0000000-0000-0000-0000-000000000002',
            '30000000-0000-0000-0000-000000000002',  -- Riley Volunteer
            '90000000-0000-0000-0000-000000000002',  -- Water Station
            '40000000-0000-0000-0000-000000000001',  -- Mumbai Marathon
            'assigned',
            'First time volunteering'
        ),
        (
            'a0000000-0000-0000-0000-000000000003',
            '30000000-0000-0000-0000-000000000003',  -- Casey Volunteer
            '90000000-0000-0000-0000-000000000003',  -- Medical Support
            '40000000-0000-0000-0000-000000000002',  -- Pune Half Marathon
            'confirmed',
            'Certified in first aid'
        );
    END IF;
END $$;

-- Add test admin user for the local development
INSERT INTO users (id, auth_id, email, first_name, last_name, role)
VALUES 
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'admin@example.com', 'Admin', 'User', 'organizer')
ON CONFLICT (id) DO NOTHING; 