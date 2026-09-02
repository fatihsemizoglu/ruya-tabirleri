import { lazy, Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { DreamReadingBanner } from '@/components/home/DreamReadingBanner';
import { SectionSkeleton } from '@/components/home/SectionSkeleton';
import { Seo } from '@/components/Seo';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';

// Aşağı katlanmış (below-the-fold) bölümler: ilk boyama sonrası yüklenir,
// framer-motion/recharts gibi ağır bağımlılıkları eager bundle'dan çıkarır.
const FeaturedDreams = lazy(() =>
  import('@/components/home/FeaturedDreams').then((m) => ({ default: m.FeaturedDreams }))
);
const CategoriesSection = lazy(() =>
  import('@/components/home/CategoriesSection').then((m) => ({ default: m.CategoriesSection }))
);
const BlogSection = lazy(() =>
  import('@/components/home/BlogSection').then((m) => ({ default: m.BlogSection }))
);
const ContactCTASection = lazy(() =>
  import('@/components/home/ContactCTASection').then((m) => ({ default: m.ContactCTASection }))
);
const InterpretCTA = lazy(() =>
  import('@/components/home/InterpretCTA').then((m) => ({ default: m.InterpretCTA }))
);

const Index = () => {
  return (
    <Layout>
      <Seo
        title="En Kapsamlı Rüya Yorumları Sitesi"
        description="Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin. Ücretsiz rüya günlüğü tutun."
        path="/"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: SITE_NAME,
            url: SITE_URL,
            logo: absoluteUrl('/pwa-512x512.png'),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: SITE_URL,
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/ara?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />
      <HeroSection />
      <DreamReadingBanner />
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturedDreams />
        <CategoriesSection />
        <BlogSection />
        <InterpretCTA />
        <ContactCTASection />
      </Suspense>
    </Layout>
  );
};

export default Index;
