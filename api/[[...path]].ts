import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'ruya-tabirleri-secret-key-2024';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.FRONTEND_URL || 'https://ruya-tabirleri.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let path = (req.url || '/').split('?')[0];
  if (path.startsWith('/api')) {
    path = path.substring(4) || '/';
  }

  const method = req.method || 'GET';

  try {
    // Health
    if (path === '/health' || path === '/') {
      return res.json({ status: 'ok' });
    }

    // Dreams list
    if (path === '/dreams' && method === 'GET') {
      const { data } = await supabase
        .from('dreams')
        .select('*, categories(name, slug)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      return res.json({ success: true, data: data || [] });
    }

    // Featured dreams
    if (path === '/dreams/featured' && method === 'GET') {
      const { data } = await supabase
        .from('dreams')
        .select('*, categories(name, slug)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('view_count', { ascending: false })
        .limit(5);

      return res.json({ success: true, data: data || [] });
    }

    // Dream by slug
    const dreamMatch = path.match(/^\/dreams\/([^\/]+)$/);
    if (dreamMatch && method === 'GET') {
      const slug = dreamMatch[1];
      const { data } = await supabase
        .from('dreams')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .single();

      if (!data) return res.status(404).json({ success: false, error: 'Not found' });

      await supabase.from('dreams').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id);
      return res.json({ success: true, data: { ...data, isLiked: false, isFavorited: false } });
    }

    // Categories
    if (path === '/categories' && method === 'GET') {
      const { data } = await supabase.from('categories').select('*').order('order_index', { ascending: true });
      return res.json({ success: true, data: data || [] });
    }

    // Blog posts
    if (path === '/blog/posts' && method === 'GET') {
      const { data } = await supabase
        .from('blog_posts')
        .select('*, profiles(full_name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      return res.json({ success: true, data: data || [] });
    }

    // Auth - Get current user
    if (path === '/auth/me' && method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token' });
      }

      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', decoded.userId)
          .single();

        if (!profile) return res.status(401).json({ success: false, error: 'User not found' });

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', decoded.userId)
          .single();

        return res.json({
          success: true,
          data: {
            id: decoded.userId,
            email: decoded.email,
            name: profile.full_name || profile.username,
            profile,
            role: roleData?.role || 'user',
          },
        });
      } catch {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
    }

    // Search
    if (path === '/search' && method === 'GET') {
      const q = (req.query.q as string) || '';
      if (!q) return res.json({ success: true, data: [] });

      const { data } = await supabase
        .from('dreams')
        .select('*, categories(name)')
        .eq('is_published', true)
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .limit(20);

      return res.json({ success: true, data: data || [], query: q });
    }

    // Contact
    if (path === '/contact' && method === 'POST') {
      const { name, email, subject, message } = req.body || {};
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, error: 'All fields required' });
      }

      await supabase.from('contact_messages').insert({
        id: uuidv4(), name, email, subject, message,
      });

      return res.status(201).json({ success: true, message: 'Message sent' });
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}