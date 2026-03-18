import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedDreams } from '@/components/home/FeaturedDreams';
import { CategoriesSection } from '@/components/home/CategoriesSection';

import { BlogSection } from '@/components/home/BlogSection';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  return (
    <Layout>
      {/* SEO Meta */}
      <title>Rüya Tabirleri - En Kapsamlı Rüya Yorumları Sitesi</title>
      <meta name="description" content="Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin. Ücretsiz rüya günlüğü tutun." />
      
      <HeroSection />
      <FeaturedDreams />
      <CategoriesSection />
      <CTASection />
      <BlogSection />
    </Layout>
  );
};

export default Index;
