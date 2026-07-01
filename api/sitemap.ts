/**
 * Public sitemap endpoint.
 * Proxies the Supabase edge function (which requires CRON_SECRET)
 * and returns the generated XML sitemap to crawlers.
 *
 * GET /api/sitemap
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  '';
const CRON_SECRET = process.env.CRON_SECRET || '';

function getMissingConfig() {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('SUPABASE_ANON_KEY');
  if (!CRON_SECRET) missing.push('CRON_SECRET');
  return missing;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const missingConfig = getMissingConfig();
  if (missingConfig.length > 0) {
    console.error('Sitemap configuration incomplete:', missingConfig.join(', '));
    return res.status(500).json({
      error: 'Server configuration incomplete',
      missing: missingConfig,
    });
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sitemap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-cron-secret': CRON_SECRET,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Sitemap edge function error:', response.status, text);
      return res.status(502).json({ error: 'Failed to generate sitemap' });
    }

    const xml = await response.text();
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap proxy error:', error);
    return res.status(502).json({ error: 'Failed to generate sitemap' });
  }
}
