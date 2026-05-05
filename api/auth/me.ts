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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const role = (roleData as any)?.role || 'user';

    res.json({
      success: true,
      data: {
        id: userId,
        email: decoded.email,
        name: (profile as any)?.full_name || (profile as any)?.username || decoded.email?.split('@')[0],
        profile,
        role,
      },
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}