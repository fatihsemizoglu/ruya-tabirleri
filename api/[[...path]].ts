import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'ruya-tabirleri-secret-key-2024';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAuthenticatedUser(req: VercelRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (err) {
    return null;
  }
}

async function isAdmin(userId: string) {
  try {
    const { data: roleData, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    if (error) return false;
    return ['admin', 'moderator'].includes(roleData?.role || '');
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Robust path handling
  let rawUrl = req.url || '/';
  let path = rawUrl.split('?')[0];
  if (path.startsWith('/api')) {
    path = path.substring(4) || '/';
  }
  if (!path.startsWith('/')) path = '/' + path;

  const method = req.method || 'GET';

  try {
    const user = await getAuthenticatedUser(req);
    const userIsAdmin = user ? await isAdmin(user.userId) : false;

    // --- CATEGORIES ---
    if (path === '/categories') {
      if (method === 'GET') {
        const { data } = await supabase.from('categories').select('*').order('order_index', { ascending: true });
        return res.json({ success: true, data: data || [] });
      }
      if (method === 'POST') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('categories').insert({ id: uuidv4(), ...req.body }).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.status(201).json({ success: true, data });
      }
    }
    const categoryDetailMatch = path.match(/^\/categories\/([^\/]+)$/);
    if (categoryDetailMatch) {
      const idOrSlug = categoryDetailMatch[1];
      if (method === 'GET') {
        const { data, error } = await supabase.from('categories').select('*').or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`).maybeSingle();
        return res.json({ success: true, data });
      }
      if (method === 'PUT') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('categories').update(req.body).eq('id', idOrSlug).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (method === 'DELETE') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { error } = await supabase.from('categories').delete().eq('id', idOrSlug);
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
    }

    // --- DREAMS ---
    if (path === '/dreams') {
      if (method === 'GET') {
        let query = supabase.from('dreams').select('*, categories(name, slug)');
        const { search, category_id, is_published, is_featured, limit = 50, page = 1 } = req.query;
        if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
        if (category_id) query = query.eq('category_id', category_id);
        if (is_published && is_published !== 'all') query = query.eq('is_published', is_published === 'true');
        if (is_featured === 'true') query = query.eq('is_featured', true);
        const from = (Number(page) - 1) * Number(limit);
        const to = from + Number(limit) - 1;
        const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to).select('*', { count: 'exact' });
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true, data: data || [], total: count || 0 });
      }
      if (method === 'POST') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('dreams').insert({ id: uuidv4(), ...req.body }).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.status(201).json({ success: true, data });
      }
    }
    const dreamDetailMatch = path.match(/^\/dreams\/([^\/]+)$/);
    if (dreamDetailMatch) {
      const idOrSlug = dreamDetailMatch[1];
      if (method === 'GET') {
        const { data, error } = await supabase.from('dreams').select('*, categories(name, slug)').or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`).maybeSingle();
        if (!data) return res.status(404).json({ success: false, error: 'Rüya bulunamadı' });
        await supabase.from('dreams').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id);
        return res.json({ success: true, data });
      }
      if (method === 'PUT') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('dreams').update(req.body).eq('id', idOrSlug).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (method === 'DELETE') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { error } = await supabase.from('dreams').delete().eq('id', idOrSlug);
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
    }

    // --- BLOG ---
    if (path === '/blog/posts') {
      if (method === 'GET') {
        const { data } = await supabase.from('blog_posts').select('*, profiles(full_name)').eq('is_published', true).order('created_at', { ascending: false });
        return res.json({ success: true, data: data || [] });
      }
      if (method === 'POST') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('blog_posts').insert({ id: uuidv4(), author_id: user?.userId, ...req.body }).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.status(201).json({ success: true, data });
      }
    }
    const blogPostMatch = path.match(/^\/blog\/posts\/([^\/]+)$/);
    if (blogPostMatch) {
      const idOrSlug = blogPostMatch[1];
      if (method === 'GET') {
        const { data, error } = await supabase.from('blog_posts').select('*, profiles(full_name), blog_categories(name, slug)').or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`).maybeSingle();
        return res.json({ success: true, data });
      }
      if (method === 'PUT') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('blog_posts').update(req.body).eq('id', idOrSlug).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (method === 'DELETE') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { error } = await supabase.from('blog_posts').delete().eq('id', idOrSlug);
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
    }

    // --- BLOG CATEGORIES ---
    if (path === '/blog/categories') {
      if (method === 'GET') {
        const { data } = await supabase.from('blog_categories').select('*').order('name', { ascending: true });
        return res.json({ success: true, data: data || [] });
      }
      if (method === 'POST') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('blog_categories').insert({ id: uuidv4(), ...req.body }).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.status(201).json({ success: true, data });
      }
    }
    const blogCategoryMatch = path.match(/^\/blog\/categories\/([^\/]+)$/);
    if (blogCategoryMatch) {
      const id = blogCategoryMatch[1];
      if (method === 'PUT') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { data, error } = await supabase.from('blog_categories').update(req.body).eq('id', id).select().single();
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true, data });
      }
      if (method === 'DELETE') {
        if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
        const { error } = await supabase.from('blog_categories').delete().eq('id', id);
        if (error) return res.status(400).json({ success: false, error: error.message });
        return res.json({ success: true });
      }
    }

    // --- ADMIN COMMENTS ---
    if (path === '/admin/comments' && method === 'GET') {
      if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
      const { data } = await supabase.from('comments').select('*, dreams(title, slug), profiles(username, full_name, avatar_url)').order('created_at', { ascending: false });
      return res.json({ success: true, data: data || [] });
    }
    const commentActionMatch = path.match(/^\/admin\/comments\/([^\/]+)\/(approve|reject)$/);
    if (commentActionMatch && method === 'PUT') {
      if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
      const id = commentActionMatch[1];
      const status = commentActionMatch[2] === 'approve';
      const { data, error } = await supabase.from('comments').update({ is_approved: status }).eq('id', id).select().single();
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    }
    const commentDeleteMatch = path.match(/^\/admin\/comments\/([^\/]+)$/);
    if (commentDeleteMatch && method === 'DELETE') {
      if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
      const { error } = await supabase.from('comments').delete().eq('id', commentDeleteMatch[1]);
      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.json({ success: true });
    }

    // --- STATS ---
    if (path === '/admin/statistics' && method === 'GET') {
      if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
      const [
        { count: totalDreams },
        { count: totalCategories },
        { count: totalUsers },
        { count: totalComments },
        { count: featuredDreams },
        { data: viewsData },
        { data: dreamsData },
        { data: categoriesData },
      ] = await Promise.all([
        supabase.from('dreams').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
        supabase.from('dreams').select('*', { count: 'exact', head: true }).eq('is_featured', true),
        supabase.from('dreams').select('view_count, like_count'),
        supabase.from('dreams').select('*').order('view_count', { ascending: false }).limit(5),
        supabase.from('categories').select('*').limit(5),
      ]);
      const totalViews = (viewsData || []).reduce((sum, d) => sum + (d.view_count || 0), 0);
      const totalLikes = (viewsData || []).reduce((sum, d) => sum + (d.like_count || 0), 0);
      return res.json({ success: true, data: { totalDreams: totalDreams || 0, totalCategories: totalCategories || 0, totalUsers: totalUsers || 0, totalViews, totalLikes, totalComments: totalComments || 0, featuredDreams: featuredDreams || 0, avgViewsPerDream: totalDreams ? Math.round(totalViews / totalDreams) : 0, dreams: dreamsData || [], categories: categoriesData || [] } });
    }

    // --- SITE SETTINGS ---
    if (path === '/admin/site-settings') {
      if (!userIsAdmin) return res.status(403).json({ success: false, error: 'Admin yetkisi gerekli' });
      if (method === 'GET') {
        const { data } = await supabase.from('site_settings').select('*');
        const settings: Record<string, any> = {};
        (data || []).forEach(s => { settings[s.key] = s.value; });
        return res.json({ success: true, data: { settings: Object.keys(settings).length ? settings : { siteName: 'Rüya Tabirleri' } } });
      }
      if (method === 'PUT') {
        const { settings } = req.body;
        const promises = Object.entries(settings).map(([key, value]) => supabase.from('site_settings').upsert({ key, value, updated_at: new Date().toISOString() }));
        await Promise.all(promises);
        return res.json({ success: true });
      }
    }

    // --- SEARCH ---
    if (path === '/search' && method === 'GET') {
      const q = req.query.q as string;
      if (!q) return res.json({ success: true, data: [] });
      const { data } = await supabase.from('dreams').select('*, categories(name)').or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(20);
      return res.json({ success: true, data: data || [] });
    }

    // --- AUTH ME ---
    if (path === '/auth/me' && method === 'GET') {
      if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.userId).single();
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', user.userId).single();
      return res.json({ success: true, data: { id: user.userId, email: user.email, name: profile?.full_name || profile?.username, profile, role: roleData?.role || 'user' } });
    }

    // Fallback for debug
    return res.status(404).json({ 
      success: false, 
      error: `Endpoint bulunamadı: ${path}`,
      debug: { rawUrl, method, path }
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
