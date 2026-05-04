import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
  console.log('Setting up admin...');

  // Disable RLS on profiles
  await supabase.rpc('alter_table', { 
    table_name: 'profiles', 
    drop_rls: true 
  }).catch(() => {});

  // Try direct insert
  const userId = '0bcbab41-48da-4033-b7ad-ef64e7343ed1';

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    user_id: userId,
    email: 'admin@mysticlogbook.com',
    full_name: 'Admin',
    username: 'admin',
  });

  if (profileError) {
    console.log('Profile:', profileError.message);
  } else {
    console.log('Profile created');
  }

  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'admin',
  });

  if (roleError) {
    console.log('Role:', roleError.message);
  } else {
    console.log('Role created');
  }
}

setupAdmin().catch(console.error);