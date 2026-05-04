import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Testing table access...');

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  console.log('Profiles:', profileError ? profileError.message : 'OK');

  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(1);

  console.log('User_roles:', roleError ? roleError.message : 'OK');

  // List all tables
  const { data: tables } = await supabase.rpc('get_tables');
  console.log('Tables:', tables);
}

checkTables().catch(console.error);