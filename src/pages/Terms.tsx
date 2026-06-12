import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

export default function Terms() {
  return (
    <Layout>
      <Seo
        title="Kullanım Koşulları"
        description="Rüya Tabirleri kullanım koşulları. Siteyi kullanırken uyulması gereken kurallar."
        path="/kullanim-kosullari"
      />
      <div className="container py-12 md:py-16 relative">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="mb-6">
            <PremiumBadge>
              <FileText className="h-3.5 w-3.5" />
              Yasal
            </PremiumBadge>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-6 text-foreground">
            Kullanım <GradientText>Koşulları</GradientText>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Son güncelleme: Ocak 2024
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 prose prose-lg dark:prose-invert max-w-none">
              <h2>1. Kabul</h2>
              <p>
                Rüya Tabirleri web sitesini ("Site") kullanarak, bu kullanım koşullarını 
                kabul etmiş sayılırsınız. Bu koşulları kabul etmiyorsanız, lütfen siteyi 
                kullanmayınız.
              </p>

              <h2>2. Hizmet Tanımı</h2>
              <p>
                Rüya Tabirleri, kullanıcılara rüya tabirleri ve yorumları sunan bir 
                bilgi platformudur. Sitemiz:
              </p>
              <ul>
                <li>Rüya tabirleri ve yorumları</li>
                <li>Rüya arama ve keşfetme özellikleri</li>
                <li>Kişisel rüya günlüğü tutma imkanı</li>
                <li>Favori rüyaları kaydetme özelliği</li>
              </ul>
              <p>hizmetlerini sunmaktadır.</p>

              <h2>3. Sorumluluk Reddi</h2>
              <p>
                <strong>Önemli:</strong> Sitemizdeki rüya tabirleri yalnızca bilgi 
                amaçlıdır ve profesyonel psikolojik, tıbbi veya dini danışmanlık 
                yerine geçmez. Rüya yorumları subjektif olup, farklı kaynaklara göre 
                değişiklik gösterebilir.
              </p>
              <p>
                Sitemizde sunulan içeriklere dayanarak alacağınız kararların 
                sorumluluğu size aittir.
              </p>

              <h2>4. Hesap Oluşturma</h2>
              <p>Hesap oluşturduğunuzda:</p>
              <ul>
                <li>Doğru ve güncel bilgiler sağlamayı kabul edersiniz</li>
                <li>Hesabınızın güvenliğinden siz sorumlusunuz</li>
                <li>Hesabınızı başkalarıyla paylaşmamalısınız</li>
                <li>18 yaşından büyük olduğunuzu veya ebeveyn izniniz olduğunu beyan edersiniz</li>
              </ul>

              <h2>5. Kullanıcı İçeriği</h2>
              <p>
                Sitemize eklediğiniz içerikler (yorumlar, rüya günlüğü girişleri vb.) 
                için aşağıdaki kurallar geçerlidir:
              </p>
              <ul>
                <li>İçeriklerinizin telif hakkı size aittir</li>
                <li>Sitemizde yayınlanması için bize lisans vermiş olursunuz</li>
                <li>Yasadışı, hakaret içeren veya uygunsuz içerik paylaşamazsınız</li>
                <li>Spam veya reklam içeriği paylaşamazsınız</li>
              </ul>

              <h2>6. Fikri Mülkiyet</h2>
              <p>
                Site tasarımı, logosu, içerikleri ve yazılımı Rüya Tabirleri'ne aittir. 
                İzinsiz kopyalama, dağıtma veya değiştirme yasaktır.
              </p>

              <h2>7. Yasaklı Davranışlar</h2>
              <p>Aşağıdaki davranışlar kesinlikle yasaktır:</p>
              <ul>
                <li>Siteye zarar verecek yazılımlar kullanmak</li>
                <li>Diğer kullanıcıları rahatsız etmek</li>
                <li>Sahte hesaplar oluşturmak</li>
                <li>Siteyi ticari amaçlarla izinsiz kullanmak</li>
                <li>Otomatik veri toplama araçları kullanmak</li>
              </ul>

              <h2>8. Hizmet Değişiklikleri</h2>
              <p>
                Hizmetlerimizi önceden haber vermeksizin değiştirme, askıya alma 
                veya sonlandırma hakkını saklı tutarız.
              </p>

              <h2>9. Hesap Sonlandırma</h2>
              <p>
                Kullanım koşullarını ihlal eden hesapları uyarı olmaksızın 
                askıya alma veya silme hakkımız saklıdır.
              </p>

              <h2>10. Sınırlı Sorumluluk</h2>
              <p>
                Rüya Tabirleri, site kullanımından kaynaklanan doğrudan veya 
                dolaylı zararlardan sorumlu tutulamaz.
              </p>

              <h2>11. Uygulanacak Hukuk</h2>
              <p>
                Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklar 
                İstanbul mahkemelerinde çözümlenecektir.
              </p>

              <h2>12. İletişim</h2>
              <p>
                Bu koşullarla ilgili sorularınız için: 
                <a href="mailto:info@ruyatabirleri.com">info@ruyatabirleri.com</a>
              </p>

              <h2>13. Değişiklikler</h2>
              <p>
                Bu kullanım koşullarını zaman zaman güncelleyebiliriz. 
                Güncel versiyonu her zaman bu sayfada bulabilirsiniz.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
