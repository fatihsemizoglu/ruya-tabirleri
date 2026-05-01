import fetch from 'node-fetch';

async function test() {
  const url = 'https://www.ruyatabirleri.com/ruyada-aba-gormek.html';
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const html = await response.text();
  
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  console.log('Title match:', titleMatch);
  
  // Try other patterns
  const titleMatch2 = html.match(/<title>([^<]+)<\/title>/i);
  console.log('Title from <title>:', titleMatch2 ? titleMatch2[1] : 'not found');
  
  // Check what h1s exist
  const h1s = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi);
  console.log('H1 tags found:', h1s ? h1s.length : 0);
  if (h1s) {
    console.log('First 3 h1s:', h1s.slice(0, 3));
  }
}

test().catch(console.error);