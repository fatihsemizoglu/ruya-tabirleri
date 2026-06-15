import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedDreams } from '@/components/home/FeaturedDreams';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { BlogSection } from '@/components/home/BlogSection';
import { ContactCTASection } from '@/components/home/ContactCTASection';
import { Seo } from '@/components/Seo';

const Index = () => {
  return (
    <Layout>
      <Seo
        title="En Kapsamlı Rüya Yorumları Sitesi"
        description="Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin. Ücretsiz rüya günlüğü tutun."
        path="/"
      />
      <HeroSection />
      <FeaturedDreams />
      <CategoriesSection />
      <BlogSection />
      <ContactCTASection />
    </Layout>
  );
};

export default Index;
