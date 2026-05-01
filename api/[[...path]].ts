import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET!;

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

  // Get path from URL
  let path = (req.url || '/').split('?')[0];
  if (path.startsWith('/api')) {
    path = path.substring(4) || '/';
  }

  const method = req.method || 'GET';

  try {
    // Health check
    if (path === '/health' || path === '/') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // Dreams list
    if (path === '/dreams' && method === 'GET') {
      const { data, error } = await supabase
        .from('dreams')
        .select('*, categories(name, slug)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return res.status(500).json({ success: false, error: error.message });

      const dreams = (data || []).map((d: any) => ({
        ...d,
        category_name: d.categories?.name,
        category_slug: d.categories?.slug,
      }));
      return res.json({ success: true, data: dreams });
    }

    // Featured dreams
    if (path === '/dreams/featured' && method === 'GET') {
      const { data, error } = await supabase
        .from('dreams')
        .select('*, categories(name, slug)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('view_count', { ascending: false })
        .limit(5);

      if (error) return res.status(500).json({ success: false, error: error.message });

      const dreams = (data || []).map((d: any) => ({
        ...d,
        category_name: d.categories?.name,
        category_slug: d.categories?.slug,
      }));
      return res.json({ success: true, data: dreams });
    }

    // Dream by slug
    const dreamSlugMatch = path.match(/^\/dreams\/([^\/]+)$/);
    if (dreamSlugMatch && method === 'GET') {
      const slug = dreamSlugMatch[1];
      const { data, error } = await supabase
        .from('dreams')
        .select('*, categories(name, slug)')
        .eq('slug', slug)
        .single();

      if (error || !data) return res.status(404).json({ success: false, error: 'Dream not found' });

      await supabase.from('dreams').update({ view_count: ((data as any).view_count || 0) + 1 }).eq('id', data.id);

      const result: any = {
        ...data,
        category_name: (data as any).categories?.name,
        category_slug: (data as any).categories?.slug,
        isLiked: false,
        isFavorited: false,
      };
      delete result.categories;
      return res.json({ success: true, data: result });
    }

    // Categories
    if (path === '/categories' && method === 'GET') {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }

    // Blog posts
    if (path === '/blog/posts' && method === 'GET') {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*, profiles(full_name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) return res.status(500).json({ success: false, error: error.message });

      const posts = (data || []).map((p: any) => ({
        ...p,
        author_name: p.profiles?.full_name,
      }));
      return res.json({ success: true, data: posts });
    }

    // Auth - Login
    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = req.body || {};

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const token = generateToken(user.id, user.email);
      const role = (roleData as any)?.role || 'user';

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: (profile as any)?.full_name || (profile as any)?.username || undefined,
            profile,
            role,
          },
          token,
        },
      });
    }

    // Auth - Register
    if (path === '/auth/register' && method === 'POST') {
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

      const token = generateToken(userId, email);

      return res.status(201).json({
        success: true,
        data: {
          user: { id: userId, email, name: full_name || username, role: 'user' },
          token,
        },
      });
    }

    // Auth - Get current user
    if (path === '/auth/me' && method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', decoded.userId)
          .single();

        if (!profile) {
          return res.status(401).json({ success: false, error: 'User not found' });
        }

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
            name: (profile as any).full_name || (profile as any).username,
            profile,
            role: (roleData as any)?.role || 'user',
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

      const { data, error } = await supabase
        .from('dreams')
        .select('*, categories(name)')
        .eq('is_published', true)
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order('view_count', { ascending: false })
        .limit(20);

      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data, query: q });
    }

    // Contact
    if (path === '/contact' && method === 'POST') {
      const { name, email, subject, message } = req.body || {};
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }

      await supabase.from('contact_messages').insert({
        id: uuidv4(),
        name,
        email,
        subject,
        message,
      });

      return res.status(201).json({ success: true, message: 'Message sent successfully' });
    }

    return res.status(404).json({ success: false, error: 'Not found' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
