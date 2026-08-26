export function generateSlug(name: string): string {
  return name
    // İ, toLowerCase sonrası "i̇" (i + U+0307 birleştirici nokta) üretir;
    // bu da slug'da fazladan tire oluşmasına yol açar. Önce dönüştürülür.
    .replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/\u0307/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
