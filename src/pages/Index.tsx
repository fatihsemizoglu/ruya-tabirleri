import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedDreams } from '@/components/home/FeaturedDreams';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { BlogSection } from '@/components/home/BlogSection';
import { CTASection } from '@/components/home/CTASection';

const Index = () => {
  useEffect(() => {
    document.title = 'Rüya Tabirleri - En Kapsamlı Rüya Yorumları Sitesi';
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin. Ücretsiz rüya günlüğü tutun.');

    return () => {
      document.title = 'Rüya Tabirleri';
    };
  }, []);

  return (
    <Layout>
      <HeroSection />
      <FeaturedDreams />
      <CategoriesSection />
      <CTASection />
      <BlogSection />
    </Layout>
  );
};

export default Index;
