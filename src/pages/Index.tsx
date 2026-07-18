import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeDreamInput } from '@/components/home/HomeDreamInput';
import { FeaturedDreams } from '@/components/home/FeaturedDreams';
import { DailyDreamCard } from '@/components/home/DailyDreamCard';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { BlogSection } from '@/components/home/BlogSection';
import { ContactCTASection } from '@/components/home/ContactCTASection';
import { Seo } from '@/components/Seo';
import { absoluteUrl, SITE_NAME, SITE_URL } from '@/lib/site';

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
      <HomeDreamInput />
      <DailyDreamCard />
      <FeaturedDreams />
      <CategoriesSection />
      <BlogSection />
      <ContactCTASection />
    </Layout>
  );
};

export default Index;
