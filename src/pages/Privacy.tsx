import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Privacy() {
  return (
    <Layout>
      <div className="container py-12 md:py-16 relative">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="mb-6">
            <PremiumBadge>
              <Shield className="h-3.5 w-3.5" />
              Gizlilik
            </PremiumBadge>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-6 text-foreground">
            Gizlilik <GradientText>Politikası</GradientText>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Son güncelleme: Ocak 2024
          </p>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 prose prose-lg dark:prose-invert max-w-none">
              <h2>1. Giriş</h2>
              <p>
                Rüya Tabirleri olarak gizliliğinize saygı duyuyor ve kişisel verilerinizi 
                korumayı taahhüt ediyoruz. Bu gizlilik politikası, web sitemizi kullandığınızda 
                hangi bilgileri topladığımızı ve bu bilgileri nasıl kullandığımızı açıklamaktadır.
              </p>

              <h2>2. Toplanan Bilgiler</h2>
              <h3>2.1 Hesap Bilgileri</h3>
              <p>
                Hesap oluşturduğunuzda aşağıdaki bilgileri topluyoruz:
              </p>
              <ul>
                <li>E-posta adresi</li>
                <li>Kullanıcı adı</li>
                <li>Profil bilgileri (isteğe bağlı)</li>
              </ul>

              <h3>2.2 Kullanım Verileri</h3>
              <p>
                Sitemizi kullandığınızda otomatik olarak aşağıdaki bilgiler toplanabilir:
              </p>
              <ul>
                <li>Arama sorguları</li>
                <li>Görüntülenen sayfalar</li>
                <li>Favori listesi</li>
                <li>Rüya günlüğü içerikleri</li>
              </ul>

              <h2>3. Bilgilerin Kullanımı</h2>
              <p>Toplanan bilgileri aşağıdaki amaçlarla kullanıyoruz:</p>
              <ul>
                <li>Hesabınızı yönetmek ve size hizmet sunmak</li>
                <li>Kişiselleştirilmiş içerik önermek</li>
                <li>Site performansını ve kullanıcı deneyimini iyileştirmek</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
              </ul>

              <h2>4. Bilgi Paylaşımı</h2>
              <p>
                Kişisel bilgilerinizi üçüncü taraflarla satmıyor veya kiralamıyoruz. 
                Bilgileriniz yalnızca aşağıdaki durumlarda paylaşılabilir:
              </p>
              <ul>
                <li>Yasal zorunluluklar</li>
                <li>Hizmet sağlayıcılarımız (veri işleme amacıyla)</li>
                <li>Açık izniniz olduğunda</li>
              </ul>

              <h2>5. Çerezler</h2>
              <p>
                Sitemiz, deneyiminizi iyileştirmek için çerezler kullanmaktadır. 
                Çerezler, tarayıcınızda saklanan küçük metin dosyalarıdır. 
                Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz.
              </p>

              <h2>6. Veri Güvenliği</h2>
              <p>
                Verilerinizi korumak için endüstri standardı güvenlik önlemleri 
                kullanıyoruz. Ancak, internet üzerinden hiçbir veri aktarımının 
                %100 güvenli olmadığını unutmayın.
              </p>

              <h2>7. Haklarınız</h2>
              <p>KVKK kapsamında aşağıdaki haklara sahipsiniz:</p>
              <ul>
                <li>Verilerinize erişim hakkı</li>
                <li>Verilerin düzeltilmesini talep etme hakkı</li>
                <li>Verilerin silinmesini talep etme hakkı</li>
                <li>Veri işlemeye itiraz etme hakkı</li>
              </ul>

              <h2>8. İletişim</h2>
              <p>
                Gizlilik politikamız hakkında sorularınız için bizimle iletişime 
                geçebilirsiniz: <a href="mailto:info@ruyatabirleri.com">info@ruyatabirleri.com</a>
              </p>

              <h2>9. Değişiklikler</h2>
              <p>
                Bu gizlilik politikasını zaman zaman güncelleyebiliriz. 
                Önemli değişiklikler olduğunda sizi bilgilendireceğiz.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
