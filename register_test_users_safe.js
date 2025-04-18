/**
 * Script to register test users in Supabase Auth
 * SAFER VERSION: Checks if users exist before creating them
 *
 * This script creates test accounts for the Marathon Registration Platform
 * with consistent UUIDs to match the database records.
 * 
 * Prerequisites:
 * 1. Node.js installed
 * 2. npm install @supabase/supabase-js dotenv
 * 3. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing environment variables!');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test accounts to register
const TEST_ACCOUNTS = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'organizer1@example.com',
    password: 'Password123!',
    user_metadata: {
      first_name: 'John',
      last_name: 'Organizer',
      role: 'organizer'
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'organizer2@example.com',
    password: 'Password123!',
    user_metadata: {
      first_name: 'Jane',
      last_name: 'Event',
      role: 'organizer'
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'runner1@example.com',
    password: 'Password123!',
    user_metadata: {
      first_name: 'Mike',
      last_name: 'Runner',
      role: 'runner'
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'runner2@example.com',
    password: 'Password123!',
    user_metadata: {
      first_name: 'Sarah',
      last_name: 'Fast',
      role: 'runner'
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'runner3@example.com',
    password: 'Password123!',
    user_metadata: {
      first_name: 'David',
      last_name: 'Marathon',
      role: 'runner'
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'volunteer1@example.com',
    password: 'Password123!',
    user_metadata: {
      first_name: 'Lisa',
      last_name: 'Helper',
      role: 'volunteer'
    }
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    email: 'volunteer2@example.com',
    password: 'Password123!',
    user_metadata: {
      first_name: 'Tom',
      last_name: 'Assist',
      role: 'volunteer'
    }
  }
];

/**
 * Check if user exists in Supabase Auth
 */
async function checkUserExists(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error checking user:', error.message);
      return false;
    }
    
    return data.users.some(user => user.email === email);
  } catch (err) {
    console.error('Exception checking user:', err.message);
    return false;
  }
}

/**
 * Create a user with admin privileges
 */
async function createUser(userData) {
  try {
    // Check if user already exists
    const userExists = await checkUserExists(userData.email);
    
    if (userExists) {
      console.log(`User ${userData.email} already exists, skipping...`);
      return { success: true, message: 'User already exists' };
    }
    
    // Create the user with a specific UUID
    const { data, error } = await supabase.auth.admin.createUser({
      uuid: userData.id,
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: userData.user_metadata
    });

    if (error) {
      console.error(`Error creating user ${userData.email}:`, error.message);
      return { success: false, message: error.message };
    }

    console.log(`Successfully created user: ${userData.email} (${userData.id})`);
    return { success: true, user: data.user };
  } catch (err) {
    console.error(`Exception creating user ${userData.email}:`, err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Main function to register all test users
 */
async function registerTestUsers() {
  console.log('Starting test user registration...');
  
  const results = [];
  
  // Process each test account sequentially
  for (const account of TEST_ACCOUNTS) {
    const result = await createUser(account);
    results.push({
      email: account.email,
      role: account.user_metadata.role,
      result
    });
  }
  
  // Output summary
  console.log('\nRegistration Summary:');
  console.log('====================');
  
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  
  results.forEach(result => {
    if (result.result.success) {
      if (result.result.message === 'User already exists') {
        console.log(`✓ SKIPPED: ${result.email} (${result.role}) - already exists`);
        skipCount++;
      } else {
        console.log(`✓ SUCCESS: ${result.email} (${result.role})`);
        successCount++;
      }
    } else {
      console.log(`✗ FAILED: ${result.email} (${result.role}) - ${result.result.message}`);
      failCount++;
    }
  });
  
  console.log('\nFinal Results:');
  console.log(`- ${successCount} users created successfully`);
  console.log(`- ${skipCount} users already existed (skipped)`);
  console.log(`- ${failCount} users failed to create`);
  console.log('\nTest user registration complete!');
}

// Execute the main function
registerTestUsers().catch(err => {
  console.error('Error in main execution:', err);
  process.exit(1);
}); 