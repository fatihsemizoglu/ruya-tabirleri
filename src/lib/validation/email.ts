/**
 * Basit ve sağlam e-posta doğrulaması.
 * Giriş trim edilir; boş değer geçersiz kabul edilir.
 * (zod .email() ile tutarlı davranış — yalnızca hafif dize kontrolü yapar,
 * MX/teslimat doğrulaması yapmaz.)
 */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 200) return false;
  // Yaygın hataları yakalayan pratik regex (kullanıcı girişi için yeterli)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}
