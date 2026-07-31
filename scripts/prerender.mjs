/**
 * Build-time prerender script for SEO.
 *
 * Runs after `vite build` and generates static HTML files with proper meta
 * tags (title, description, canonical, OG, Twitter, JSON-LD) for every
 * content page (dreams, blog posts, categories).
 *
 * Vercel serves static files before rewrites, so prerendered files at
 * `dist/ruya/<slug>/index.html` will be served for `/ruya/<slug>` instead
 * of the SPA fallback `index.html`.
 *
 * Usage:  node scripts/prerender.mjs
 * Env:    VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SITE_URL
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');

async function loadEnvFile(fileName) {
  const filePath = join(__dirname, '..', fileName);
  if (!existsSync(filePath)) return;

  const content = await readFile(filePath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

await loadEnvFile('.env.production');
await loadEnvFile('.env.local');

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://dagjpitlouekbnwdcpbz.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const SITE_URL = (process.env.VITE_SITE_URL || 'https://ruya-tabirleri.vercel.app').replace(/\/$/, '');

const SITE_NAME = 'Rüya Tabirleri';
const DEFAULT_DESCRIPTION =
  'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.';
const PAGE_SIZE = 1000;

// ── Helpers ──────────────────────────────────────────────────────────

function absoluteUrl(path = '/') {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str, max = 160) {
  const s = String(str || '').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Replace or insert a meta tag in <head> */
function setMeta(html, selector, replacement) {
  if (selector instanceof RegExp && selector.test(html)) {
    return html.replace(selector, replacement);
  }

  if (typeof selector === 'string' && html.includes(selector)) {
    return html.replace(selector, replacement);
  }

  // Insert before </head>
  return html.replace('</head>', `  ${replacement}\n</head>`);
}

/**
 * Inject SEO meta tags into the template HTML.
 * Replaces title, description, canonical, OG, Twitter tags and adds JSON-LD.
 */
function injectSeo(template, opts) {
  let html = template;

  const fullTitle = opts.title ? `${opts.title} | ${SITE_NAME}` : SITE_NAME;
  const description = opts.description || DEFAULT_DESCRIPTION;
  const canonical = absoluteUrl(opts.path);
  const imageUrl = absoluteUrl(opts.image || '/og-image.png');
  const type = opts.type || 'website';

  // Title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`);

  // Description
  html = setMeta(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );

  // Canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
  );

  // OG tags
  html = setMeta(
    html,
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:type" content="${type}" />`,
  );
  html = setMeta(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
  );
  html = setMeta(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`,
  );
  html = setMeta(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  html = setMeta(
    html,
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
  );

  // Twitter tags
  html = setMeta(
    html,
    /<meta\s+name="twitter:url"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:url" content="${escapeHtml(canonical)}" />`,
  );
  html = setMeta(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />`,
  );
  html = setMeta(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  );
  html = setMeta(
    html,
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
  );

  // Remove existing JSON-LD blocks (from index.html template) and inject new ones
  html = html.replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');

  if (opts.jsonLd) {
    const blocks = Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd];
    const ldHtml = blocks
      .map(
        (ld) =>
          `  <script type="application/ld+json">\n    ${JSON.stringify(ld)}\n  </script>`,
      )
      .join('\n');
    html = html.replace('</head>', `${ldHtml}\n</head>`);
  }

  // Add noindex for non-content pages if requested
  if (opts.noindex) {
    html = setMeta(html, /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/, `<meta name="robots" content="noindex,nofollow" />`);
  }

  return html;
}

async function fetchAllRows(table, select, filter = '') {
  const rows = [];
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };

  for (let from = 0; ; from += PAGE_SIZE) {
    let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=updated_at.desc&limit=${PAGE_SIZE}&offset=${from}`;
    if (filter) url += `&${filter}`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`  ⚠ ${table} fetch failed: ${res.status} ${res.statusText}`);
      break;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return rows;
}

async function writePage(relativePath, html) {
  const normalizedPath = relativePath.replace(/^\/+/, '');
  const outDir = join(DIST_DIR, normalizedPath);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), html, 'utf-8');
}

// ── Page generators ──────────────────────────────────────────────────

function dreamPageHtml(template, dream) {
  const title = dream.meta_title || dream.title;
  const plainContent = stripHtml(dream.content);
  const description = dream.meta_description || truncate(plainContent) || `${dream.title} rüya tabiri ve yorumu`;
  const path = `/ruya/${dream.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      url: absoluteUrl(path),
      datePublished: dream.created_at,
      dateModified: dream.updated_at || dream.created_at,
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: absoluteUrl('/pwa-512x512.png') },
      },
      mainEntityOfPage: absoluteUrl(path),
      keywords: dream.keywords?.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: dream.title, item: absoluteUrl(path) },
      ],
    },
  ];

  return injectSeo(template, {
    title,
    description,
    path,
    type: 'article',
    jsonLd,
  });
}

function blogPageHtml(template, post) {
  const title = post.meta_title || post.title;
  const plainContent = stripHtml(post.content);
  const description = post.meta_description || truncate(plainContent) || `${post.title} blog yazısı`;
  const path = `/blog/${post.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description,
      url: absoluteUrl(path),
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: absoluteUrl('/pwa-512x512.png') },
      },
      mainEntityOfPage: absoluteUrl(path),
    },
  ];

  return injectSeo(template, {
    title,
    description,
    path,
    type: 'article',
    jsonLd,
  });
}

function categoryPageHtml(template, category) {
  const title = category.meta_title || `${category.name} Rüya Tabirleri`;
  const description = category.meta_description || truncate(category.description || '') || `${category.name} kategorisindeki rüya tabirleri ve yorumları`;
  const path = `/kategori/${category.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
  };

  return injectSeo(template, {
    title,
    description,
    path,
    jsonLd,
  });
}

function staticPageHtml(template, opts) {
  return injectSeo(template, opts);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌙 Prerender başlıyor...');

  if (!SUPABASE_ANON_KEY) {
    console.warn('  ⚠ SUPABASE_ANON_KEY yok — prerender atlanıyor (SPA fallback kullanılacak)');
    return;
  }

  const templatePath = join(DIST_DIR, 'index.html');
  if (!existsSync(templatePath)) {
    console.error(`  ✗ ${templatePath} bulunamadı — önce 'vite build' çalıştırın`);
    process.exit(1);
  }

  const template = await readFile(templatePath, 'utf-8');
  let count = 0;

  // ── Static pages with custom SEO ──
  const staticPages = [
    {
      path: '/ara',
      title: 'Rüya Ara',
      description: 'Binlerce rüya tabiri arasında arama yapın. Gelişmiş filtrelerle rüyalarınızın anlamını keşfedin.',
    },
    {
      path: '/populer',
      title: 'Popüler Rüya Tabirleri',
      description: 'En çok okunan rüya tabirleri ve yorumları. Popüler rüyaların anlamlarını keşfedin.',
    },
    {
      path: '/kategoriler',
      title: 'Rüya Kategorileri',
      description: 'Rüya tabirlerini kategorilere göre inceleyin. Hayvanlar, doğa, insanlar ve daha fazlası.',
    },
    {
      path: '/blog',
      title: 'Rüya Blogu',
      description: 'Rüya yorumları, rüya bilimi ve mistik konularda blog yazıları.',
    },
    {
      path: '/hakkimizda',
      title: 'Hakkımızda',
      description: 'Rüya Tabirleri sitesi hakkında bilgi. Misyonumuz ve vizyonumuz.',
    },
    {
      path: '/iletisim',
      title: 'İletişim',
      description: 'Rüya Tabirleri ekibiyle iletişime geçin. Soru, öneri ve işbirlikleri için.',
    },
  ];

  for (const page of staticPages) {
    const html = staticPageHtml(template, page);
    await writePage(page.path, html);
    count++;
  }
  console.log(`  📄 ${count} statik sayfa prerender edildi`);

  // ── Dreams ──
  try {
    const dreams = await fetchAllRows(
      'dreams',
      'slug,title,meta_title,meta_description,content,keywords,created_at,updated_at',
      'is_published=eq.true',
    );
    console.log(`  🌙 ${dreams.length} rüya tabiri çekildi`);

    for (const dream of dreams) {
      if (!dream.slug) continue;
      const html = dreamPageHtml(template, dream);
      await writePage(`/ruya/${dream.slug}`, html);
      count++;
    }
  } catch (err) {
    console.warn(`  ⚠ Rüya prerender hatası: ${err.message}`);
  }

  // ── Blog posts ──
  try {
    const posts = await fetchAllRows(
      'blog_posts',
      'slug,title,meta_title,meta_description,content,created_at,updated_at',
      'is_published=eq.true',
    );
    console.log(`  📝 ${posts.length} blog yazısı çekildi`);

    for (const post of posts) {
      if (!post.slug) continue;
      const html = blogPageHtml(template, post);
      await writePage(`/blog/${post.slug}`, html);
      count++;
    }
  } catch (err) {
    console.warn(`  ⚠ Blog prerender hatası: ${err.message}`);
  }

  // ── Categories ──
  try {
    const categories = await fetchAllRows(
      'categories',
      'slug,name,description',
    );
    console.log(`  📁 ${categories.length} kategori çekildi`);

    for (const cat of categories) {
      if (!cat.slug) continue;
      const html = categoryPageHtml(template, cat);
      await writePage(`/kategori/${cat.slug}`, html);
      count++;
    }
  } catch (err) {
    console.warn(`  ⚠ Kategori prerender hatası: ${err.message}`);
  }

  console.log(`\n✅ Prerender tamamlandı: ${count} sayfa oluşturuldu`);
}

main().catch((err) => {
  console.error('Prerender hatası:', err);
  // Don't fail the build — SPA fallback still works
  process.exit(0);
});