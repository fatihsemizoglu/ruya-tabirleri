import fetch from 'node-fetch';
import fs from 'fs';

async function test() {
  const res = await fetch('https://www.ruyatabirleri.com/yorum/harf/a', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  fs.writeFileSync('debug.html', html);
  console.log('Saved to debug.html');
  
  // Try to find dream links
  const dreamLinks = html.match(/href="(\/ruyada-[^"]+\.html)"/g);
  console.log('Dream links found:', dreamLinks ? dreamLinks.length : 0);
  if (dreamLinks) {
    console.log('Sample:', dreamLinks.slice(0, 5));
  }
}

test().catch(console.error);