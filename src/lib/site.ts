export const SITE_NAME = 'Rüya Tabirleri';
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://ruya-tabirleri.vercel.app').replace(/\/$/, '');
export const DEFAULT_DESCRIPTION =
  'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
