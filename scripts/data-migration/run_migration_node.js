#!/usr/bin/env node
/**
 * Rüya Tabirleri Migration Script
 * 
 * Usage:
 *   1. Set SUPABASE_SERVICE_ROLE_KEY environment variable
 *      (Get it from Supabase Dashboard > Project Settings > API > service_role key)
 * 
 *   2. Run: node run_migration_node.js
 * 
 * This script reads the comparison results and applies INSERT/UPDATE
 * operations to the Supabase database using the service role key.
 */

const SUPABASE_URL = 'https://dagjpitlouekbnwdcpbz.supabase.co';

async function main() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set.');
    console.error('');
    console.error('To get the key:');
    console.error('  1. Open https://supabase.com/dashboard/project/dagjpitlouekbnwdcpbz');
    console.error('  2. Go to Project Settings > API');
    console.error('  3. Copy the service_role key (NOT the anon/public key)');
    console.error('  4. Run: set SUPABASE_SERVICE_ROLE_KEY=your_key_here && node run_migration_node.js');
    console.error('     (or use export on Mac/Linux)');
    process.exit(1);
  }

  // Read comparison results
  const fs = await import('fs');
  const results = JSON.parse(fs.readFileSync('compare_results.json', 'utf-8'));

  const toAdd = results.to_add || [];
  const toUpdate = results.to_update || [];

  console.log(`Loaded: ${toAdd.length} to ADD, ${toUpdate.length} to UPDATE\n`);

  let added = 0;
  let updated = 0;
  let errors = 0;

  // Process ADD operations
  console.log('=== ADDING NEW DREAMS ===');
  for (const dream of toAdd) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/dreams`, {
        method: 'POST',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(buildDreamPayload(dream)),
      });

      if (res.status === 201) {
        added++;
        process.stdout.write('.');
      } else {
        errors++;
        const text = await res.text();
        console.error(`\nERROR adding "${dream.title}": ${res.status} ${text.slice(0, 100)}`);
      }
    } catch (err) {
      errors++;
      console.error(`\nERROR adding "${dream.title}": ${err.message}`);
    }
  }

  // Process UPDATE operations
  console.log('\n\n=== UPDATING EXISTING DREAMS ===');
  for (const dream of toUpdate) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/dreams?id=eq.${dream.existing_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(buildDreamPayload(dream, true)),
      });

      if (res.status === 204) {
        updated++;
        process.stdout.write('.');
      } else {
        errors++;
        const text = await res.text();
        console.error(`\nERROR updating "${dream.word_title}": ${res.status} ${text.slice(0, 100)}`);
      }
    } catch (err) {
      errors++;
      console.error(`\nERROR updating "${dream.word_title}": ${err.message}`);
    }
  }

  console.log('\n\n=== MIGRATION COMPLETE ===');
  console.log(`Added: ${added}/${toAdd.length}`);
  console.log(`Updated: ${updated}/${toUpdate.length}`);
  console.log(`Errors: ${errors}`);
}

function buildDreamPayload(dream, isUpdate = false) {
  const title = dream.word_title || dream.title;
  const content = dream.word_content || dream.content;
  const htmlContent = plainToHtml(content);
  const slug = generateSlug(title);

  const payload = {
    title,
    slug,
    content: htmlContent,
    is_published: true,
    is_featured: false,
    keywords: extractKeywords(htmlContent, title),
    meta_title: generateMetaTitle(title),
    meta_description: generateMetaDescription(htmlContent),
  };

  if (isUpdate) {
    delete payload.is_published;
    delete payload.is_featured;
  }

  return payload;
}

function plainToHtml(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => `<p>${escapeHtml(line)}</p>`)
    .join('\n');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function extractKeywords(content, title) {
  const text = content.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').toLowerCase();
  const words = text.split(/\s+/).filter(w => w.length >= 4);
  const stopWords = new Set([
    've', 'ile', 'icin', 'bir', 'bu', 'su', 'da', 'de', 'ki', 'ama', 'gibi',
    'kadar', 'sonra', 'once', 'daha', 'cok', 'az', 'her', 'hic', 'bazi',
    'tum', 'butun', 'ise', 'iken', 'diye', 'kendi', 'kendisi', 'bunu', 'onu',
    'sanki', 'gore', 'karsi', 'dolay', 'bile', 'hem', 'ne', 'ya', 'veya',
    'ancak', 'fakat', 'cunku', 'gormek', 'ruyada', 'oldugunu', 'diyen',
  ]);
  const freq = {};
  words.filter(w => !stopWords.has(w)).forEach(w => {
    freq[w] = (freq[w] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
}

function generateMetaTitle(title) {
  const t = title.replace(/<[^>]*>/g, '').trim();
  return t.length > 57 ? t.slice(0, 57) + '...' : t;
}

function generateMetaDescription(content) {
  const text = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const desc = text.split(/[.!?]+/)[0] || text;
  return desc.length > 157 ? desc.slice(0, 157) + '...' : desc;
}

main().catch(console.error);
