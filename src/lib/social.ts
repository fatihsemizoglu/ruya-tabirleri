/**
 * Sosyal medya URL'lerini normalize eder.
 * Protokolsüz adresler (örn. "instagram.com/kullanici") href olarak kullanıldığında
 * göreli link sanılır ve kırık link üretir — buna https:// ekler.
 *
 * Güvenlik: javascript: vb. eksotik protokoller reddedilir (boş döner);
 * yalnızca http/https, protokol-göreli (//), mailto: ve tel: geçerlidir.
 */
const ALLOWED_PROTOCOL = /^(https?:\/\/|mailto:|tel:)/i;

export function normalizeSocialUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return trimmed;
  if (ALLOWED_PROTOCOL.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return ''; // tanınmayan protokol → güvenli boş
  return `https://${trimmed}`;
}
