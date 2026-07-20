import DOMPurify from 'dompurify';

const purifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'hr', 'pre', 'code', 'sup', 'sub', 'mark'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload'],
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, purifyConfig);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function looksLikeHeading(line: string): boolean {
  const text = line.trim();
  if (!text || text.length > 100) return false;
  if (/^Rüyada\s+/i.test(text)) return true;
  if (/[:：]$/.test(text)) return true;
  if (text.length < 60 && /^(Rüyada|Rüya|Boğa|Yılan|Kara|Siyah|Beyaz|Yeşil|Sarı|Kırmızı|Su|Ev|Para|Altın|Bebek|Köpek|Kedi)\b/i.test(text) && !/[.!?]$/.test(text)) return true;
  return false;
}

const headingPattern = /(Rüyada\s+[^.!?\n]{3,80}?(?:görmek|yemek|içmek|kesmek|almak|vermek|gitmek|gelmek|olmak|binmek|yakalamak|taşımak|bulmak|kaybetmek|düşmek|çıkmak|girmek|kaçmak|koşmak|uçmak|yüzmek|dikmek|sökmek|yıkamak|temizlemek|kurmak|yapmak|konuşmak|bakmak|duymak|izlemek|seyretmek))(?:\s*[:,]?\s*)/gi;

export function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Za-zÇĞİÖŞÜçğıöşü])/g);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) sentences.push(trimmed);
  }
  if (sentences.length <= 1) {
    const alt = text.match(/[^.!?\n]+[.!?]+|[^.!?\n]+$/g);
    if (alt) return alt.map(s => s.trim()).filter(Boolean);
  }
  return sentences;
}

export function formatPlainDreamContent(content: string, title: string): string {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();

  if (!normalized) return '';
  if (/<(p|h[1-6]|ul|ol|blockquote|strong|b)\b/i.test(normalized)) {
    return sanitizeHtml(normalized);
  }

  const lines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    const longText = lines[0] || normalized;
    const sentences = splitIntoSentences(longText);
    if (sentences.length <= 2) {
      return sanitizeHtml(`<p>${escapeHtml(longText)}</p>`);
    }
    const blocks: string[] = [];
    let currentBlock: string[] = [];
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;
      const match = trimmed.match(headingPattern);
      if (match && currentBlock.length > 0) {
        blocks.push(`<p>${currentBlock.map(escapeHtml).join(' ')}</p>`);
        currentBlock = [];
      }
      if (match) {
        blocks.push(`<h3>${escapeHtml(match[1]!)}</h3>`);
        const rest = trimmed.replace(match[0], '').trim();
        if (rest) currentBlock.push(rest);
      } else {
        currentBlock.push(trimmed);
      }
    }
    if (currentBlock.length > 0) {
      blocks.push(`<p>${currentBlock.map(escapeHtml).join(' ')}</p>`);
    }
    return sanitizeHtml(blocks.join('\n'));
  }

  const sections = lines.flatMap((line) => {
    const match = line.match(headingPattern);
    if (match) {
      const parts: string[] = [];
      let rest = line;
      let found;
      while ((found = rest.match(headingPattern)) !== null) {
        const idx = found.index ?? 0;
        if (idx > 0) {
          const before = rest.slice(0, idx).trim();
          if (before) parts.push(before);
        }
        parts.push(`__H3__${found[1]!}`);
        rest = rest.slice(idx + found[0].length).trim();
      }
      if (rest) parts.push(rest);
      return parts;
    }
    return [line];
  });

  const htmlBlocks: string[] = [];
  for (const section of sections) {
    const line = section.trim();
    if (!line) continue;
    if (line.startsWith('__H3__')) {
      htmlBlocks.push(`<h3>${escapeHtml(line.replace('__H3__', ''))}</h3>`);
    } else if (looksLikeHeading(line)) {
      htmlBlocks.push(`<h3>${escapeHtml(line.replace(/[:：]$/, ''))}</h3>`);
    } else {
      htmlBlocks.push(`<p>${escapeHtml(line)}</p>`);
    }
  }

  if (htmlBlocks.length > 1) {
    const merged: string[] = [];
    for (let i = 0; i < htmlBlocks.length; i++) {
      const current = htmlBlocks[i]!;
      if (current.startsWith('<p>') && merged.length > 0 && merged[merged.length - 1]!.startsWith('<p>')) {
        merged[merged.length - 1] = merged[merged.length - 1]!.replace('</p>', '') + ' ' + current.replace('<p>', '').replace('</p>', '');
      } else {
        merged.push(current);
      }
    }
    return sanitizeHtml(merged.join('\n'));
  }

  return sanitizeHtml(htmlBlocks.join('\n'));
}
