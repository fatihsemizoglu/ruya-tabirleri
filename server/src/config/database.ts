import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn({ msg: 'Warning: Supabase credentials not configured' }, 'Missing credentials');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      logger.error({ err: error }, 'Database connection failed');
      return false;
    }
    logger.info({}, 'Database connected successfully');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    return false;
  }
}

export default supabase;