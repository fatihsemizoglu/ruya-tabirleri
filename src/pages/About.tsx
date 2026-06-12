import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Moon, Users, BookOpen, Heart, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

export default function About() {
  return (
    <Layout>
      <Seo
        title="Hakkımızda"
        description="Rüya Tabirleri, Türkiye'nin en kapsamlı rüya tabirleri sitesidir. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin."
        path="/hakkimizda"
      />
      <div className="container py-12 md:py-16 relative">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="mb-6">
            <PremiumBadge>
              <Moon className="h-3.5 w-3.5" />
              Hakkımızda
            </PremiumBadge>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-6 text-foreground">
            Rüya <GradientText>Tabirleri</GradientText> Hakkında
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Türkiye'nin en kapsamlı rüya tabirleri sitesi olarak, rüyalarınızın anlamını
            keşfetmenize yardımcı oluyoruz.
          </p>
        </div>

        {/* Mission Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="border-none shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-serif font-bold mb-4">Misyonumuz</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Rüya Tabirleri olarak misyonumuz, insanların rüyalarını anlamalarına ve 
                bilinçaltlarıyla bağlantı kurmalarına yardımcı olmaktır. Binlerce yıllık 
                İslami gelenek ile modern psikolojik yaklaşımları bir araya getirerek, 
                kapsamlı ve güvenilir rüya yorumları sunuyoruz.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Her rüyanın bir anlamı olduğuna inanıyor ve bu anlamları keşfetmenizde 
                size rehberlik etmekten mutluluk duyuyoruz.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-serif font-bold text-center mb-8">Neden Bizi Tercih Etmelisiniz?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Kapsamlı İçerik</h3>
              <p className="text-sm text-muted-foreground">
                Binlerce rüya tabiri ve detaylı yorumlar
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Güvenilir Kaynaklar</h3>
              <p className="text-sm text-muted-foreground">
                İslami kaynaklardan ve uzman görüşlerinden derlenen yorumlar
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Aktif Topluluk</h3>
              <p className="text-sm text-muted-foreground">
                Deneyimlerini paylaşan binlerce kullanıcı
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Kişisel Deneyim</h3>
              <p className="text-sm text-muted-foreground">
                Rüya günlüğü ve favori listesi özellikleri
              </p>
            </Card>
          </div>
        </div>

        {/* Story Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-center mb-8">Hikayemiz</h2>
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-muted-foreground leading-relaxed mb-4">
              Rüya Tabirleri, insanların rüyalarını anlamalarına yardımcı olmak amacıyla 
              kurulmuş bir platformdur. Yıllar içinde binlerce rüya tabirini bir araya 
              getirerek, Türkiye'nin en kapsamlı rüya tabiri arşivini oluşturduk.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              İslami kaynaklardan modern psikolojiye kadar geniş bir yelpazede 
              araştırmalar yaparak, her rüyanın farklı perspektiflerden yorumlanmasını 
              sağlıyoruz. Amacımız, rüyalarınızın size ne anlatmak istediğini 
              keşfetmenize yardımcı olmaktır.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Sizin de bu yolculuğa katılmanızı ve rüyalarınızın gizemli dünyasını 
              keşfetmenizi bekliyoruz.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
