import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with local PostgreSQL database connection
const supabaseUrl = 'http://localhost:54321'; // This is the default Supabase API URL
const supabaseKey = 'your-local-anon-key'; // For local dev, you can use any string

// Create a client
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Function to test local database connection
export async function testLocalDatabaseConnection() {
  try {
    // Try to query a table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    if (error) {
      console.error('Database connection error:', error);
      return {
        success: false,
        message: error.message,
        error
      };
    }

    return {
      success: true,
      message: 'Successfully connected to local PostgreSQL database',
      data: data || []
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error
    };
  }
}

// You can run this directly to test
if (require.main === module) {
  testLocalDatabaseConnection().then(result => {
    console.log(JSON.stringify(result, null, 2));
  });
} 