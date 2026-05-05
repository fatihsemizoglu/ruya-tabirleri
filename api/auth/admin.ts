import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'ruya-tabirleri-secret-key-2024';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const userId = authData.user.id;

    // Check for admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const role = roleData?.role || 'user';

    if (!['admin', 'moderator'].includes(role)) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email,
          name: profile?.full_name || profile?.username || email.split('@')[0],
          profile,
          role,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
