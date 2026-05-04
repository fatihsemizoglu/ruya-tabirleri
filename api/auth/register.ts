import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'ruya-tabirleri-secret-key-2024';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.FRONTEND_URL || 'https://ruya-tabirleri.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password, full_name, username } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${allowedOrigin}/auth/callback`,
        data: { full_name, username },
      },
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ success: false, error: 'User already registered' });
      }
      return res.status(400).json({ success: false, error: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ success: false, error: 'Registration failed' });
    }

    const userId = authData.user.id;

    await supabase.from('profiles').upsert({
      id: userId,
      user_id: userId,
      email,
      full_name: full_name || null,
      username: username || null,
    }, { onConflict: 'id' });

    await supabase.from('user_roles').upsert({
      user_id: userId,
      role: 'user',
    }, { onConflict: 'user_id' });

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email,
          name: full_name || username || email.split('@')[0],
          profile: { full_name, username },
          role: 'user',
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}