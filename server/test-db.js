import { supabase } from './src/config/database.js';

async function test() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Success:', data);
    }
  } catch (err) {
    console.log('Exception:', err);
  }
}

test();