import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findOrCreateAdminProfile() {
  const email = 'admin@mysticlogbook.com';
  const fullName = 'Admin';

  console.log('Finding user...');

  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error listing users:', userError.message);
    return;
  }

  const adminUser = users.find(u => u.email === email);

  if (!adminUser) {
    console.log('Admin user not found, creating...');
    return;
  }

  const userId = adminUser.id;
  console.log('Found admin user:', userId);

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existingProfile) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: userId,
        email,
        full_name: fullName,
        username: 'admin',
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile error:', profileError.message);
    } else {
      console.log('Profile created/updated');
    }
  } else {
    console.log('Profile already exists');
  }

  // Check if role exists
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existingRole) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
      });

    if (roleError) {
      console.error('Role error:', roleError.message);
    } else {
      console.log('Role created: admin');
    }
  } else {
    console.log('Role already exists:', existingRole.role);
  }

  console.log('\n✓ Admin user ready!');
  console.log('Email:', email);
  console.log('Password: admin123');
}

findOrCreateAdminProfile().catch(console.error);