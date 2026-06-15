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
  if (!text || text.length > 90) return false;
  if (/[:：]$/.test(text)) return true;
  if (/^(Rüyada|Rüya|Boğa|Yılan|Kara|Siyah|Beyaz|Yeşil|Sarı|Kırmızı|Su|Ev|Para|Altın|Bebek|Köpek|Kedi)\b/i.test(text) && !/[.!?]$/.test(text)) return true;
  return false;
}

const inlineHeadingPattern = /(?:Rüyada|Rüya|Boğa|Yılan|Kara|Siyah|Beyaz|Yeşil|Sarı|Kırmızı)[^.!?\n]{3,70}?görmek/gi;

export function splitInlineHeadings(line: string): string[] {
  const parts: string[] = [];
  const matches = [...line.matchAll(inlineHeadingPattern)];

  if (matches.length <= 1) return [line];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match?.index ?? 0;
    const end = matches[index + 1]?.index ?? line.length;

    if (index === 0 && start > 0) {
      const intro = line.slice(0, start).trim();
      if (intro) parts.push(intro);
    }

    const section = line.slice(start, end).trim();
    if (section) parts.push(section);
  }

  return parts.length ? parts : [line];
}

export function normalizeTitleToken(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\b(rüyada|rüya|ruyada|ruya|görmek|gormek|gördüğünü|gordugunu|görmek nedir|ne anlama gelir)\b/gi, ' ')
    .replace(/[^a-zçğıöşü0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function removeTrailingTitleRepeat(lines: string[], title: string): string[] {
  if (lines.length < 2) return lines;

  const titleToken = normalizeTitleToken(title);
  if (!titleToken) return lines;

  const lastLine = lines[lines.length - 1] ?? '';
  const lastToken = normalizeTitleToken(lastLine);
  const lastWordCount = lastToken.split(' ').filter(Boolean).length;

  if (lastWordCount > 5) return lines;
  if (lastToken === titleToken || titleToken.endsWith(lastToken) || lastToken.endsWith(titleToken)) {
    return lines.slice(0, -1);
  }

  return lines;
}

export function removeTrailingTitleSentence(line: string, title: string): string {
  const titleToken = normalizeTitleToken(title);
  if (!titleToken) return line;

  const sentences = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) ?? [line];
  if (sentences.length < 2) return line;

  const lastSentence = sentences[sentences.length - 1] ?? '';
  const lastToken = normalizeTitleToken(lastSentence);
  const lastWordCount = lastToken.split(' ').filter(Boolean).length;

  if (lastWordCount <= 5 && (lastToken === titleToken || titleToken.endsWith(lastToken) || lastToken.endsWith(titleToken))) {
    return sentences.slice(0, -1).join(' ').trim();
  }

  return line;
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

  const lines = removeTrailingTitleRepeat(normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean), title);

  const sections = lines.flatMap(splitInlineHeadings);

  const html = sections.map((section) => {
    const line = removeTrailingTitleSentence(section, title);
    if (!line) return '';
    const clean = escapeHtml(line.replace(/[:：]$/, ''));
    if (looksLikeHeading(line)) {
      return `<h3>${clean}</h3>`;
    }
    const headingMatch = clean.match(/^((?:Rüyada|Rüya|Boğa|Yılan|Kara|Siyah|Beyaz|Yeşil|Sarı|Kırmızı)[^.!?]{3,70}?görmek)(?:\s*[:,]?\s*)?(.*)$/i);
    if (headingMatch?.[1]) {
      const heading = headingMatch[1].trim();
      const paragraph = headingMatch[2]?.trim();
      return [`<h3>${heading}</h3>`, paragraph ? `<p>${paragraph}</p>` : ''].filter(Boolean).join('\n');
    }
    return `<p>${clean}</p>`;
  }).filter(Boolean).join('\n');

  return sanitizeHtml(html);
}
