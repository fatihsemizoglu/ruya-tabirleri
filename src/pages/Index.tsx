import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedDreams } from '@/components/home/FeaturedDreams';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { BlogSection } from '@/components/home/BlogSection';
import { CTASection } from '@/components/home/CTASection';
import { SEOMetadata } from '@/components/seo/SEOMetadata';
import { DailyPoll } from '@/components/community/DailyPoll';
import { TrendingThemes } from '@/components/community/TrendingThemes';
import { JsonLd, buildWebsiteSchema } from '@/components/seo/JsonLd';

const Index = () => {
  return (
    <Layout>
      <SEOMetadata
        title="Rüya Tabirleri"
        description="Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin. Ücretsiz rüya günlüğü tutun."
      />
      <JsonLd data={buildWebsiteSchema()} />
      <HeroSection />
      <div className="container py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendingThemes />
        </div>
        <div>
          <DailyPoll />
        </div>
      </div>
      <FeaturedDreams />
      <CategoriesSection />
      <CTASection />
      <BlogSection />
    </Layout>
  );
};

export default Index;
