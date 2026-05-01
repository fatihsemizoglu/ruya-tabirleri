import { writeFileSync, mkdirSync, existsSync, appendFileSync, readFileSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'https://www.ruyatabirleri.com';

const TURKISH_LETTERS = ['a', 'b', 'c', 'cc', 'd', 'e', 'f', 'g', 'h', 'i', 'ii', 'j', 'k', 'l', 'm', 'n', 'o', 'oo', 'p', 'r', 's', 'ss', 't', 'u', 'uu', 'v', 'y', 'z'];

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      console.log(`Retry ${i + 1}/${retries} for ${url}`);
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

function extractDreamLinks(html: string): string[] {
  const links: string[] = [];
  
  const regex1 = /href="(https:\/\/www\.ruyatabirleri\.com\/ruyada-[^"#]+\.html)"/g;
  let match;
  while ((match = regex1.exec(html)) !== null) {
    const path = match[1].replace('https://www.ruyatabirleri.com', '');
    if (!links.includes(path) && path.includes('.html')) {
      links.push(path);
    }
  }
  
  const regex2 = /href="(\/ruyada-[^"#]+\.html)"/g;
  while ((match = regex2.exec(html)) !== null) {
    if (!links.includes(match[1]) && match[1].includes('.html')) {
      links.push(match[1]);
    }
  }
  
  return [...new Set(links)];
}

function getTotalPages(html: string): number {
  const pageLinks = html.match(/<a[^>]*href="[^"]*sayfa=(\d+)[^"]*"[^>]*>/gi);
  if (pageLinks) {
    const nums = pageLinks.map(p => {
      const m = p.match(/sayfa=(\d+)/);
      return m ? parseInt(m[1]) : 0;
    }).filter(n => n > 0);
    if (nums.length > 0) return Math.max(...nums);
  }
  
  const pageMatch = html.match(/<span[^>]*class="[^"]*active[^"]*"[^>]*>(\d+)/i);
  if (pageMatch) {
    const nextPages = html.match(/<a[^>]*class="[^"]*page[^"]*"[^>]*>(\d+)/gi);
    if (nextPages) {
      const nums = nextPages.map(p => {
        const m = p.match(/\d+/);
        return m ? parseInt(m[0]) : 0;
      }).filter(n => n > 0);
      if (nums.length > 0) return Math.max(...nums);
    }
  }
  
  const lastPageMatch = html.match(/<a[^>]*class="[^"]*last[^"]*"[^>]*href="[^"]*sayfa=(\d+)/i);
  if (lastPageMatch) return parseInt(lastPageMatch[1]);
  
  return 1;
}

function extractDreamContent(html: string, url: string): any {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(' - RuyaTabirleri.com', '').trim() : '';

  const slug = url.replace('/ruyada-', '').replace('.html', '');

  let islamic = '';
  let psychological = '';
  
  const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
  
  for (let i = 0; i < h2Matches.length; i++) {
    const h2Text = h2Matches[i].replace(/<[^>]+>/g, '').toLowerCase();
    
    if (h2Text.includes('islami') || (h2Text.includes('rüya') && h2Text.includes('tabir') && !h2Text.includes('psikolojik'))) {
      const nextSection = h2Matches.slice(i + 1).join('');
      const nextH2 = nextSection.match(/<h2/i);
      if (nextH2) {
        const endIdx = nextSection.indexOf('<h2');
        islamic = cleanHtml(nextSection.substring(0, endIdx > 0 ? endIdx : nextSection.length));
      } else {
        islamic = cleanHtml(nextSection);
      }
    }
    
    if (h2Text.includes('psikolojik') || h2Text.includes('psikolojik yorum')) {
      const nextSection = h2Matches.slice(i + 1).join('');
      psychological = cleanHtml(nextSection);
    }
  }

  if (!islamic) {
    const islamicMatch = html.match(/İslami Rüya Tabirleri([\s\S]*?)<h2/gi);
    if (islamicMatch) {
      islamic = cleanHtml(islamicMatch[0].replace(/İslami Rüya Tabirleri/gi, ''));
    }
  }
  
  if (!psychological) {
    const psychoMatch = html.match(/Psikolojik Yorum([\s\S]*?)$/gi);
    if (psychoMatch) {
      psychological = cleanHtml(psychoMatch[0].replace(/Psikolojik Yorum/gi, ''));
    }
  }

  const content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  return {
    slug,
    title,
    content,
    islamic_interpretation: islamic,
    psychological_interpretation: psychological,
    source: 'ruyatabirleri.com',
    source_url: BASE_URL + url
  };
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#\d+;/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

async function scrapeLetter(letter: string) {
  console.log(`📂 Scraping letter: ${letter}`);
  
  const url = `${BASE_URL}/yorum/harf/${letter}`;
  const html = await fetchWithRetry(url);
  
  const totalPages = getTotalPages(html);
  console.log(`   Total pages: ${totalPages}`);
  
  const allLinks: string[] = [];
  
  for (let page = 1; page <= totalPages; page++) {
    const pageUrl = page === 1 ? url : `${url}/page/${page}`;
    const pageHtml = await fetchWithRetry(pageUrl);
    const links = extractDreamLinks(pageHtml);
    allLinks.push(...links);
    console.log(`   Page ${page}: ${links.length} dreams`);
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`   Total: ${allLinks.length} dreams`);
  return allLinks;
}

async function scrapeDream(link: string, outputPath: string) {
  const url = BASE_URL + link;
  let html;
  try {
    html = await fetchWithRetry(url);
  } catch (err) {
    console.log(`   ✗ Fetch error: ${link} - ${err instanceof Error ? err.message : 'Unknown error'}`);
    return;
  }
  
  if (!html || html.length < 100) {
    console.log(`   ✗ Empty response: ${link} (length: ${html?.length || 0})`);
    return;
  }
  
  const dream = extractDreamContent(html, link);
  
  if (!dream.title) {
    console.log(`   ✗ No title extracted: ${link}`);
    return;
  }
  
  const existing = existsSync(outputPath) 
    ? JSON.parse(readFileSync(outputPath, 'utf-8')) 
    : [];
  
  const exists = existing.some((d: any) => d.slug === dream.slug);
  if (!exists) {
    existing.push(dream);
    writeFileSync(outputPath, JSON.stringify(existing, null, 2), 'utf-8');
  }
  
  console.log(`   ✓ ${dream.title}`);
}

async function main() {
  const outputDir = join(process.cwd(), 'scraped-data');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = join(outputDir, 'dreams.json');
  
  const allDreams: any[] = [];

  for (const letter of TURKISH_LETTERS) {
    try {
      const links = await scrapeLetter(letter);
      
      for (const link of links) {
        try {
          await new Promise(r => setTimeout(r, 400));
          await scrapeDream(link, outputPath);
        } catch (err) {
          console.log(`   ✗ Failed: ${link}`);
        }
      }
    } catch (err) {
      console.log(`✗ Letter ${letter} failed:`, err);
    }
  }

  console.log(`\n✅ Scraping complete!`);
  console.log(`📁 Saved to: ${outputPath}`);
}

main().catch(console.error);