import fetch from 'node-fetch';
import fs from 'fs';

async function test() {
  const res = await fetch('https://www.ruyatabirleri.com/yorum/harf/a', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Save first 10000 chars
  console.log(html.substring(0, 15000));
}

test().catch(console.error);