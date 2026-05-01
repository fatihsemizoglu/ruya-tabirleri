const fetch = require('node-fetch');

async function test() {
  const res = await fetch('https://www.ruyatabirleri.com/yorum/harf/a', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  });
  const html = await res.text();
  
  // Find dream links - look for /ruyada- pattern
  const linkRegex = /href="(\/ruyada-[^"#]+\.html)"/g;
  const links = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  
  console.log('Total links:', links.length);
  console.log('First 5:', links.slice(0, 5));
  
  // Check pagination with /page/ pattern
  const pageRegex = /href="[^"]*\/page\/(\d+)[^"]*"/g;
  const pages = [];
  while ((match = pageRegex.exec(html)) !== null) {
    pages.push(match[1]);
  }
  
  console.log('Pagination pages:', pages);
  
  // Look for next link
  const nextLink = html.match(/<link rel="next" href="([^"]+)"/);
  console.log('Next link:', nextLink ? nextLink[1] : 'none');
}

test().catch(console.error);