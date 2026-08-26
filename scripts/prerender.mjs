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
// Not: robots.txt sitemap URL'i de aynı SITE_URL'den türetilir (aşağıda)
// Fallback: özel alan adı alınana dek Vercel deployment adresi.
const SITE_URL = (process.env.VITE_SITE_URL || 'https://ruya-tabirleri.vercel.app').replace(/\/$/, '');

const SITE_NAME = 'Rüya Tabirleri';
const DEFAULT_DESCRIPTION =
  'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.';
const PAGE_SIZE = 1000;

// Minimal Turkish slugify (mirrors src/lib/slug.ts — kept local to avoid build deps)
function generateSlug(name) {
  return String(name)
    .replace(/İ/g, 'i') // İ, toLowerCase ile "i̇" (i + U+0307) üretir — önce dönüştür
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/\u0307/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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

/**
 * DB'den gelen zengin metni güvenli statik HTML'e çevirir:
 * script/style/iframe gibi etiketleri ve event handler niteliklerini söker.
 * (Admin kaynaklı içerik olsa da savunma derinliği için.)
 */
function sanitizeHtmlContent(html) {
  return String(html || '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[\s\S]*?(<\/iframe>|\/?>)/gi, '')
    .replace(/<(object|embed|form|input|button)\b[\s\S]*?(<\/\1>|\/?>)/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"');
}

const BODY_WRAPPER_STYLE =
  'margin:0 auto;padding:24px;max-width:760px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.7;color:#1f2937;';

/** Statik içeriği <div id="root"> içine basar (JS çalıştırmayan botlar için). */
function injectBody(template, contentHtml) {
  if (!contentHtml) return template;
  const rootPattern = /(<div\s+id="root"\s*>)([\s]*)(<\/div>)/;
  if (!rootPattern.test(template)) return template;
  const bodyBlock = `<div style="${BODY_WRAPPER_STYLE}">\n${contentHtml}\n</div>`;
  return template.replace(rootPattern, `$1${bodyBlock}$3`);
}

/** H1 altına yerleşen 40-60 kelimelik tanım bloğu (GEO entity pattern). */
function buildDefinitionBlock(text, maxSentences = 2) {
  const sentences = String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean);
  const def = sentences.slice(0, maxSentences).join(' ');
  return def
    ? `<p style="font-size:1.05em;"><strong>${escapeHtml(def)}</strong></p>`
    : '';
}

function buildBreadcrumb(items) {
  const parts = items.map((item, i) => {
    const last = i === items.length - 1;
    const label = escapeHtml(item.name);
    return last
      ? `<span aria-current="page">${label}</span>`
      : `<a href="${absoluteUrl(item.path)}">${label}</a>`;
  });
  return `<nav aria-label="breadcrumb" style="font-size:.875em;margin-bottom:12px;">${parts.join(' › ')}</nav>`;
}

function buildDreamBody(dream) {
  const plain = stripHtml(dream.content);
  const safeContent = sanitizeHtmlContent(dream.content);
  const keywords = Array.isArray(dream.keywords) ? dream.keywords.slice(0, 12) : [];
  const faqIntro = buildDefinitionBlock(plain);

  const keywordChips = keywords.length
    ? `<ul style="padding-left:20px;">${keywords.map((k) => `<li>${escapeHtml(String(k))}</li>`).join('')}</ul>`
    : '';

  return [
    buildBreadcrumb([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Rüya Tabirleri', path: '/populer' },
      { name: dream.title, path: `/ruya/${dream.slug}` },
    ]),
    `<h1>${escapeHtml(dream.title)}</h1>`,
    faqIntro,
    safeContent,
    keywordChips,
  ].filter(Boolean).join('\n');
}

function buildBlogBody(post) {
  const plain = stripHtml(post.content);
  return [
    buildBreadcrumb([
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` },
    ]),
    `<h1>${escapeHtml(post.title)}</h1>`,
    buildDefinitionBlock(plain),
    sanitizeHtmlContent(post.content),
  ].filter(Boolean).join('\n');
}

function buildStaticBody(title, description) {
  return `<h1>${escapeHtml(title)}</h1>\n<p>${escapeHtml(description)}</p>`;
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

  // Static body content for JS-less crawlers (GEO) — replaced by React on mount.
  if (opts.bodyHtml) {
    html = injectBody(html, opts.bodyHtml);
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
      image: absoluteUrl('/og-image.png'),
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
      reviewedBy: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/hakkimizda') },
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
    bodyHtml: buildDreamBody(dream),
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
      image: absoluteUrl('/og-image.png'),
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
    bodyHtml: buildBlogBody(post),
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
    bodyHtml: buildStaticBody(title, description || `${category.name} kategorisindeki rüya tabirleri`),
  });
}

function staticPageHtml(template, opts) {
  return injectSeo(template, {
    ...opts,
    bodyHtml: opts.bodyHtml || buildStaticBody(opts.title, opts.description),
  });
}

// ── Symbol glossary ──────────────────────────────────────────────────

function buildSymbolGlossaryFromDreams(dreams) {
  const stopWords = new Set(['rüya','ruya','görmek','gormek','ne','demek','anlamı','anlami','nedir','hakkında','tabiri']);
  const map = new Map();
  for (const dream of dreams) {
    const keywords = Array.isArray(dream.keywords) ? dream.keywords : [];
    for (const kw of keywords) {
      const term = String(kw).trim();
      if (term.length < 2 || term.length > 40) continue;
      if (stopWords.has(term.toLocaleLowerCase('tr-TR'))) continue;
      if (/^\d+$/.test(term)) continue;
      const key = term.toLocaleLowerCase('tr-TR');
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { term, slug: generateSlug(term), count: 1 });
    }
  }
  return [...map.values()].sort((a, b) => a.term.localeCompare(b.term, 'tr-TR'));
}

function symbolIndexHtml(template, symbols) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Rüya Sembolleri Sözlüğü',
    url: absoluteUrl('/semboller'),
    inLanguage: 'tr-TR',
    description: 'Rüya tabirlerinde geçen sembollerin alfabetik sözlüğü.',
    hasDefinedTerm: symbols.slice(0, 300).map((s) => ({
      '@type': 'DefinedTerm',
      name: s.term,
      url: absoluteUrl(`/sembol/${s.slug}`),
      inDefinedTermSet: absoluteUrl('/semboller'),
    })),
  };
  return injectSeo(template, {
    title: 'Rüya Sembolleri Sözlüğü',
    description: `Rüyalardaki ${symbols.length} sembolün tabirlerine alfabetik sözlükten ulaşın.`,
    path: '/semboller',
    jsonLd,
    bodyHtml: [
      '<h1>Rüya Sembolleri Sözlüğü</h1>',
      `<p>Rüya tabirlerinde geçen ${symbols.length} sembolün alfabetik listesi. Bir sembolün anlamını görmek için listeden seçin.</p>`,
      `<ul style="columns:2;gap:24px;">${symbols.slice(0, 500).map((s) => `<li><a href="${absoluteUrl(`/sembol/${s.slug}`)}">${escapeHtml(s.term)}</a></li>`).join('')}</ul>`,
    ].join('\n'),
  });
}

function symbolPageHtml(template, symbol) {
  const title = `Rüyada ${symbol.term} Görmek Ne Anlama Gelir?`;
  const description = `Rüyada ${symbol.term} görmek: İslami ve psikolojik tabirlerle ${symbol.term} rüyasının anlamı ve ${symbol.count} farklı yorum.`;
  const path = `/sembol/${symbol.slug}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: symbol.term,
      url: absoluteUrl(path),
      inDefinedTermSet: absoluteUrl('/semboller'),
      inLanguage: 'tr-TR',
      description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Sembol Sözlüğü', item: absoluteUrl('/semboller') },
        { '@type': 'ListItem', position: 3, name: symbol.term, item: absoluteUrl(path) },
      ],
    },
  ];
  return injectSeo(template, {
    title,
    description,
    path,
    jsonLd,
    bodyHtml: [
      buildBreadcrumb([
        { name: 'Ana Sayfa', path: '/' },
        { name: 'Sembol Sözlüğü', path: '/semboller' },
        { name: symbol.term, path: `/sembol/${symbol.slug}` },
      ]),
      `<h1>${escapeHtml(title)}</h1>`,
      `<p><strong>${escapeHtml(description)}</strong></p>`,
      `<p>Rüyada ${escapeHtml(symbol.term)} görmekle ilgili ${symbol.count} farklı rüya yorumu sitemizde bulunuyor; detaylı tabirler için ilgili rüya sayfalarımızı ziyaret edebilirsiniz.</p>`,
      `<p><a href="${absoluteUrl('/populer')}">Popüler rüya tabirlerine göz atın</a>.</p>`,
    ].join('\n'),
  });
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌙 Prerender başlıyor...');

  // %VITE_SITE_URL% placeholder'ını çöz: robots.txt + kök index.html + 404.html.
  // (Vite, env tanımsızsa placeholder'ı dokunmadan bırakabilir; boş ezebilir —
  //  burada tek otorite olarak VITE_SITE_URL || fallback kullanılır.)
  const resolvedSiteUrl = SITE_URL;
  const placeholderTargets = [
    join(DIST_DIR, 'robots.txt'),
    join(DIST_DIR, 'index.html'),
    join(DIST_DIR, '404.html'),
  ];
  for (const target of placeholderTargets) {
    if (!existsSync(target)) continue;
    const content = await readFile(target, 'utf-8');
    if (content.includes('%VITE_SITE_URL%')) {
      await writeFile(target, content.replaceAll('%VITE_SITE_URL%', resolvedSiteUrl), 'utf-8');
      console.log(`  🔗 %VITE_SITE_URL% → ${resolvedSiteUrl} (${target.split(/[\\/]/).pop()})`);
    }
  }

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
    {
      path: '/az',
      title: "A'dan Z'ye Rüya Tabirleri",
      description: "A'dan Z'ye tüm rüya tabirleri alfabetik sırada. Aradığınız rüyayı harfine göre kolayca bulun.",
    },
    {
      path: '/gizlilik',
      title: 'Gizlilik Politikası',
      description: 'Rüya Tabirleri gizlilik politikası: kişisel verilerinizin korunması ve çerez kullanımı.',
    },
    {
      path: '/kullanim-kosullari',
      title: 'Kullanım Koşulları',
      description: 'Rüya Tabirleri sitesi kullanım koşulları ve hizmet sınırlandırmaları.',
    },
    {
      path: '/kvkk',
      title: 'KVKK Aydınlatma Metni',
      description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.',
    },
    {
      path: '/cerez-politikasi',
      title: 'Çerez Politikası',
      description: 'Sitede kullanılan çerezlerin türleri, amaçları ve yönetimi hakkında bilgi.',
    },
    {
      path: '/ruyami-yorumlat',
      title: 'Ücretsiz Rüya Yorumlatma — AI Destekli',
      description: 'Rüyanızı yazın, anında İslami ve psikolojik yorumunuzu alın. İbn-i Sirin geleneği ve psikoloji literatürüyle desteklenen ücretsiz AI rüya yorumlatma servisi.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Rüyamı yorumlatmak ücretsiz mi?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Evet. Günde 3 kez ücretsiz rüya yorumu alabilirsiniz. Rüyanızı yazın, sistem İslami ve psikolojik kaynakları temel alarak size özel bir yorum oluşturur.',
            },
          },
          {
            '@type': 'Question',
            name: 'AI rüya yorumu nasıl hazırlanıyor?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rüyanızdaki semboller, klasik İslami rüya tabiri kaynakları (İbn-i Sirin, Nablusi geleneği) ve modern psikoloji literatürüyle eşleştirilir. Sonuç, yorum geleneği çerçevesinde bir rehberdir; kesin hüküm içermez.',
            },
          },
        ],
      },
    },
    {
      path: '/istatistikler',
      title: 'Rüya İstatistikleri — En Çok Görülen Rüyalar',
      description: "Arşivimizdeki binlerce rüya tabirinin görüntülenme, kategori ve alfabetik istatistikleri. En çok okunan rüyalar ve topluluk eğilimleri.",
    },
    {
      path: '/sss',
      title: 'Sıkça Sorulan Sorular',
      description: 'Rüya tabiri hakkında en çok merak edilen soruların cevapları: Rüyalar neden görülür, yılan görmek ne anlama gelir, rüya günlüğü nasıl tutulur ve daha fazlası.',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Rüya tabiri nedir ve rüyaların anlamı var mıdır?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rüya tabiri, rüyada görülen sembollerin ve olayların geleneksel, İslami ve psikolojik açıdan yorumlanmasıdır. Rüyaların tek bir kesin anlamı olmamakla birlikte, semboller binlerce yıllık kültürel birikim içinde belirli anlamlar kazanmıştır.',
            },
          },
          {
            '@type': 'Question',
            name: 'Rüyada yılan görmek ne anlama gelir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Geleneksel yorumlara göre yılan; gizli düşmanlık, tehlike veya korkuya işaret edebilir. Psikolojik yorumlarda ise yılan genellikle bilinçaltındaki korkuları, bastırılmış duyguları veya dönüşümü temsil eder.',
            },
          },
          {
            '@type': 'Question',
            name: 'Rüyalar neden görülür? Bilimsel açıklaması nedir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rüyalar, uykunun REM evresinde beynin bilgi işleme ve duygusal düzenleme süreçlerinin bir sonucudur. Rüyalar; günlük deneyimlerin işlenmesi, anıların pekiştirilmesi ve duygusal sorunların çözümlenmesine yardımcı olur.',
            },
          },
          {
            '@type': 'Question',
            name: 'Rüya tabirleri gerçekten doğru mu?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rüya tabirleri kesin birer kehanet değil, sembolik anlam kılavuzlarıdır. Aynı sembol farklı kişiler için farklı anlamlar taşıyabilir. Tabirleri bir yol gösterici olarak değerlendirmek en sağlıklı yaklaşımdır.',
            },
          },
          {
            '@type': 'Question',
            name: 'Rüyamı nasıl daha iyi hatırlayabilirim?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Uyanır uyanmaz rüyayı not etmek, yatak başında bir rüya günlüğü bulundurmak ve uyku düzenini korumak rüya hatırlama oranını ciddi şekilde artırır.',
            },
          },
          {
            '@type': 'Question',
            name: 'Rüyalar geleceği haber verir mi?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Bazı geleneksel yorumlar rüyaların ilahi bir işaret olabileceğini kabul ederken, bilimsel yaklaşım rüyaların geleceği önceden bildirdiğine dair kanıt bulamamıştır. Rüyaların çoğu zaman günlük yaşamın yansıması olduğu kabul edilir.',
            },
          },
          {
            '@type': 'Question',
            name: 'İslami rüya tabirlerinde nelere dikkat edilir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'İslami rüya tabiri geleneğinde rüyalar; sadık, karışık ve şeytani rüya olarak üçe ayrılır. Güzel rüyaların Allah\u2019tan, kötü rüyaların şeytandan olduğu kabul edilir; kötü rüyaların kimseye anlatılmaması tavsiye edilir.',
            },
          },
          {
            '@type': 'Question',
            name: 'Aynı rüyayı defalarca görmek ne anlama gelir?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tekrarlayan rüyalar, çözülmemiş bir soruna veya bastırılmış bir duyguya işaret edebilir. Zihin, çözümlenmemiş bir konuyu rüya yoluyla tekrar tekrar gündeme getirir.',
            },
          },
          {
            '@type': 'Question',
            name: 'Rüyada ölüm görmek kötü müdür?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rüyada ölüm görmek çoğu kültürde doğrudan ölümle ilişkili değildir; genellikle bir değişimin, yeniden doğuşun sembolüdür. Psikolojik olarak hayatınızda tamamlanmış bir dönüşümü yansıtabilir.',
            },
          },
          {
            '@type': 'Question',
            name: 'Rüya yorumlarına inanmalı mıyım?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rüya yorumlarına yaklaşım kişisel bir tercihtir. Tabirlerimizi bir keşif aracı olarak kullanabilir, kendi sezgilerinizle birleştirebilirsiniz. Ancak rüya yorumlarının tıbbi, hukuki veya finansal kararlara temel oluşturmaması gerektiğini unutmayın.',
            },
          },
        ],
      },
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

    // ── Symbol glossary (derived from dreams) ──
    const symbols = buildSymbolGlossaryFromDreams(dreams);
    console.log(`  🔮 ${symbols.length} sembol çıkarıldı`);
    await writePage('/semboller', symbolIndexHtml(template, symbols));
    count++;
    for (const s of symbols) {
      await writePage(`/sembol/${s.slug}`, symbolPageHtml(template, s));
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

  // ── 404 (soft-404 önleme: JS'siz botlar ve doğruluk için) ──
  try {
    const notFoundHtml = injectSeo(template, {
      title: 'Sayfa Bulunamadı',
      description: 'Aradığınız sayfa bulunamadı. Ana sayfadan rüya tabirleri arasında arama yapabilirsiniz.',
      path: '/404',
      noindex: true,
      bodyHtml:
        '<h1>Sayfa Bulunamadı</h1>\n<p>Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>\n<p><a href="/">Ana sayfaya dönün</a> veya <a href="/ara">rüya tabirlerinde arama yapın</a>.</p>',
    });
    await writeFile(join(DIST_DIR, '404.html'), notFoundHtml, 'utf-8');
    count++;
    console.log('  🚫 404.html üretildi');
  } catch (err) {
    console.warn(`  ⚠ 404 prerender hatası: ${err.message}`);
  }

  console.log(`\n✅ Prerender tamamlandı: ${count} sayfa oluşturuldu`);
}

main().catch((err) => {
  console.error('Prerender hatası:', err);
  // Don't fail the build — SPA fallback still works
  process.exit(0);
});