import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dagjpitlouekbnwdcpbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ2pwaXRsb3Vla2Jud2RjcGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NTkxMzUsImV4cCI6MjA5MzIzNTEzNX0.pDuBHQZOQDEZ4mWQFVxGX9MbQKfnXr4hmh9K5NJyVjo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');

    // Try to sign up a test user
    const { data, error } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'password123'
    });

    if (error) {
      console.log('Signup error:', error);
    } else {
      console.log('Signup success:', data);
    }
  } catch (err) {
    console.log('Exception:', err);
  }
}

testSupabase();