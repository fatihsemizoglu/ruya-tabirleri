import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.FRONTEND_URL || 'https://ruyatabirleri.vercel.app';
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

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await supabase.from('users').insert({ id: userId, email, password: hashedPassword });
    await supabase.from('profiles').insert({
      id: uuidv4(),
      user_id: userId,
      email,
      full_name: full_name || null,
      username: username || null,
    });
    await supabase.from('user_roles').insert({ id: uuidv4(), user_id: userId, role: 'user' });

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      data: {
        user: { id: userId, email, name: full_name || username, role: 'user' },
        token,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
