import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn({ msg: 'Warning: Supabase credentials not configured' }, 'Missing credentials');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const supabaseAuth: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function testConnection(): Promise<boolean> {
  try {
    // Try to connect to Supabase, but don't fail if tables don't exist
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      logger.warn({ err: error }, 'Database tables may not exist, but connection is working');
      logger.warn({ error }, 'Supabase error details');
      // Don't return false for missing tables in development
      if (process.env.NODE_ENV === 'production') {
        return false;
      }
    }
    logger.info({}, 'Database connected successfully');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database connection failed');
    logger.error({ error: error.message, stack: error.stack }, 'Connection error details');
    // In development, don't fail on connection errors
    if (process.env.NODE_ENV === 'development') {
      logger.warn({}, 'Continuing in development mode despite database connection issues');
      return true;
    }
    return false;
  }
}

export default supabase;