import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  escapeHtml,
  looksLikeHeading,
  splitIntoSentences,
  formatPlainDreamContent,
} from './dreamContent';

describe('sanitizeHtml', () => {
  it('script etiketlerini temizler', () => {
    const out = sanitizeHtml('<p>Merhaba</p><script>alert(1)</script>');
    expect(out).toContain('<p>Merhaba</p>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert');
  });

  it('iframe ve event handler\'ları temizler', () => {
    const out = sanitizeHtml('<p onclick="x()">a</p><iframe src="e"></iframe>');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('onclick');
  });

  it('izinli etiketleri korur', () => {
    const out = sanitizeHtml('<p><strong>kalın</strong> ve <em>italik</em></p>');
    expect(out).toContain('<strong>kalın</strong>');
    expect(out).toContain('<em>italik</em>');
  });

  it('link href\'ini korur', () => {
    const out = sanitizeHtml('<a href="https://ornek.com">link</a>');
    expect(out).toContain('href="https://ornek.com"');
  });
});

describe('escapeHtml', () => {
  it('özel karakterleri kaçırır', () => {
    expect(escapeHtml('<b>"x" & \'y\'</b>')).toBe(
      '&lt;b&gt;&quot;x&quot; &amp; &#039;y&#039;&lt;/b&gt;'
    );
  });

  it('düz metni değiştirmez', () => {
    expect(escapeHtml('rüya tabiri')).toBe('rüya tabiri');
  });
});

describe('looksLikeHeading', () => {
  it('"Rüyada ..." kalıbını başlık sayar', () => {
    expect(looksLikeHeading('Rüyada yılan görmek')).toBe(true);
  });

  it('iki nokta ile biten satırı başlık sayar', () => {
    expect(looksLikeHeading('İslami yorum:')).toBe(true);
  });

  it('uzun cümleleri başlık saymaz', () => {
    expect(looksLikeHeading('Bu cümle oldukça uzun ve nokta ile bitiyor. Bu yüzden başlık değil.'.repeat(3))).toBe(false);
  });

  it('boş satırı başlık saymaz', () => {
    expect(looksLikeHeading('')).toBe(false);
    expect(looksLikeHeading('   ')).toBe(false);
  });
});

describe('splitIntoSentences', () => {
  it('nokta, ünlem ve soru işaretine göre böler', () => {
    const out = splitIntoSentences('İlk cümle. İkinci cümle! Üçüncü mü?');
    expect(out).toEqual(['İlk cümle.', 'İkinci cümle!', 'Üçüncü mü?']);
  });

  it('boş metin için boş dizi döndürür', () => {
    expect(splitIntoSentences('')).toEqual([]);
  });
});

describe('formatPlainDreamContent', () => {
  it('HTML içeren içeriği olduğu gibi sanitize eder', () => {
    const out = formatPlainDreamContent('<p><strong>Rüya</strong> içeriği</p>', 'Başlık');
    expect(out).toContain('<p>');
    expect(out).toContain('<strong>Rüya</strong>');
  });

  it('düz metni <p> içine alır', () => {
    const out = formatPlainDreamContent('Kısa rüya metni.', 'Başlık');
    expect(out).toBe('<p>Kısa rüya metni.</p>');
  });

  it('"Rüyada X görmek" satırlarını h3 başlığa çevirir', () => {
    const content = 'Rüyada yılan görmek: Kötü bir düşmandır.\nGenel olarak uyarı anlamı taşır.';
    const out = formatPlainDreamContent(content, 'Yılan');
    expect(out).toContain('<h3>Rüyada yılan görmek</h3>');
    expect(out).toContain('<p>');
    expect(out).not.toContain('Kötü bir düşmandır.<');
  });

  it('boş içeriği boş dize döndürür', () => {
    expect(formatPlainDreamContent('', 'Başlık')).toBe('');
    expect(formatPlainDreamContent('   ', 'Başlık')).toBe('');
  });

  it('XSS payload\'ını temizler', () => {
    const out = formatPlainDreamContent('<img src=x onerror=alert(1)>', 'Başlık');
    // img etiketi çalıştırılabilir HTML olarak değil, escape edilmiş metin olarak render edilir
    expect(out).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    expect(out).not.toContain('<img');
  });
});
