import { supabase } from '../config/database';
import { env } from '../config/env';

const BASE_URL = env.FRONTEND_URL || 'https://ruyatabirleri.com';

export async function generateSitemap(): Promise<string> {
  const [{ data: dreams }, { data: categories }, { data: blogPosts }, { data: symbols }] = await Promise.all([
    supabase.from('dreams').select('slug, updated_at').eq('is_published', true).order('updated_at', { ascending: false }),
    supabase.from('categories').select('slug, updated_at'),
    supabase.from('blog_posts').select('slug, updated_at').eq('is_published', true).order('updated_at', { ascending: false }),
    supabase.from('dream_symbols').select('slug, updated_at'),
  ]);

  const urls: { loc: string; lastmod: string; priority: string; changefreq: string }[] = [
    { loc: `${BASE_URL}/`, lastmod: new Date().toISOString(), priority: '1.0', changefreq: 'daily' },
    { loc: `${BASE_URL}/kategoriler`, lastmod: new Date().toISOString(), priority: '0.9', changefreq: 'weekly' },
    { loc: `${BASE_URL}/ruya-tabirleri`, lastmod: new Date().toISOString(), priority: '0.9', changefreq: 'daily' },
    { loc: `${BASE_URL}/ruya-yorumlat`, lastmod: new Date().toISOString(), priority: '0.8', changefreq: 'monthly' },
    { loc: `${BASE_URL}/sozluk`, lastmod: new Date().toISOString(), priority: '0.8', changefreq: 'weekly' },
    { loc: `${BASE_URL}/harita`, lastmod: new Date().toISOString(), priority: '0.7', changefreq: 'monthly' },
    { loc: `${BASE_URL}/blog`, lastmod: new Date().toISOString(), priority: '0.8', changefreq: 'daily' },
    { loc: `${BASE_URL}/hakkimizda`, lastmod: new Date().toISOString(), priority: '0.5', changefreq: 'monthly' },
    { loc: `${BASE_URL}/iletisim`, lastmod: new Date().toISOString(), priority: '0.5', changefreq: 'monthly' },
  ];

  (dreams || []).forEach((d: any) => {
    urls.push({
      loc: `${BASE_URL}/ruya/${d.slug}`,
      lastmod: d.updated_at || new Date().toISOString(),
      priority: '0.8',
      changefreq: 'weekly',
    });
  });

  (categories || []).forEach((c: any) => {
    urls.push({
      loc: `${BASE_URL}/kategori/${c.slug}`,
      lastmod: c.updated_at || new Date().toISOString(),
      priority: '0.7',
      changefreq: 'weekly',
    });
  });

  (blogPosts || []).forEach((p: any) => {
    urls.push({
      loc: `${BASE_URL}/blog/${p.slug}`,
      lastmod: p.updated_at || new Date().toISOString(),
      priority: '0.7',
      changefreq: 'monthly',
    });
  });

  (symbols || []).forEach((s: any) => {
    urls.push({
      loc: `${BASE_URL}/sembol/${s.slug}`,
      lastmod: s.updated_at || new Date().toISOString(),
      priority: '0.6',
      changefreq: 'monthly',
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}
