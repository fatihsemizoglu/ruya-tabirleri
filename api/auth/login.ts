import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  console.log('[login] Request:', req.method, req.url);
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const { default: jwt } = await import('jsonwebtoken');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    const JWT_SECRET = process.env.JWT_SECRET || 'ruya-tabirleri-secret-key-2024';

    console.log('[login] ENV - URL:', supabaseUrl ? 'set' : 'missing');
    console.log('[login] ENV - KEY:', supabaseServiceKey ? 'set' : 'missing');

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Server config missing',
        debug: { url: !!supabaseUrl, key: !!supabaseServiceKey } 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, password, isAdmin } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    console.log('[login] Login attempt:', email);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.log('[login] Auth error:', authError?.message);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const userId = authData.user.id;
    console.log('[login] Success, userId:', userId);

    if (isAdmin) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!roleData?.role || !['admin', 'moderator'].includes(roleData.role)) {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
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

    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email,
          name: profile?.full_name || profile?.username || email.split('@')[0],
          profile,
          role: roleData?.role || 'user',
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('[login] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}