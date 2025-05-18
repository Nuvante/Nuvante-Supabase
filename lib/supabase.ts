import { createClient } from '@supabase/supabase-js';
import 'server-only';
import { Database } from '../src/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // Disable session persistence since we're using Clerk
  },
  db: {
    schema: 'public'
  }
});

// Add error handling for database operations
const handleDatabaseError = (error: any) => {
  console.error('Database operation failed:', error);
  throw new Error(error.message || 'Database operation failed');
};

// Export both the client and error handler
export { handleDatabaseError };
export default supabase;