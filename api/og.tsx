/**
 * Dinamik Open Graph görseli (1200x630).
 *
 * Kullanım: /api/og?title=Rüyada%20Yılan%20Görmek&category=Yılan
 * Prerender ve runtime Seo bileşeni rüya sayfaları için bu URL'i kullanır;
 * sosyal platform önizlemelerinde sayfaya özel başlık görünür.
 */
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = (searchParams.get('title') || 'Rüya Tabirleri').slice(0, 120);
  const category = searchParams.get('category') || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, opacity: 0.85 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: '#818cf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            🌙
          </div>
          <div style={{ fontWeight: 600 }}>Rüya Tabirleri</div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 60 ? 60 : 76,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 1000,
          }}
        >
          {title}
        </div>

        {category ? (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              padding: '10px 28px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            {category}
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 28, opacity: 0.8 }}>
            İslami ve psikolojik rüya yorumları
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
