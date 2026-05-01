import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn({}, 'Warning: Supabase credentials not configured');
}

export const supabaseAnon: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default supabaseAnon;