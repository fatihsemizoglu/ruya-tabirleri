import fetch from 'node-fetch';

async function test() {
  const url = 'https://www.ruyatabirleri.com/ruyada-aba-gormek.html';
  console.log('Fetching:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    console.log('Status:', response.status);
    console.log('StatusText:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.log('Response not OK');
      return;
    }
    
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('windows-1254');
    const html = decoder.decode(buffer);
    console.log('First 2000 chars of HTML:');
    console.log(html.substring(0, 2000));
  } catch (err) {
    console.log('Error:', err instanceof Error ? err.message : err);
  }
}

test();