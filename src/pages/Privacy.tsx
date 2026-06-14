import { Layout } from '@/components/layout/Layout';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Shield, LockKeyhole, Database, Cookie, UserCheck, Mail, CheckCircle2, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

const highlights = [
  { icon: LockKeyhole, title: 'Gizlilik önceliği', text: 'Kişisel verilerinizi yalnızca hizmeti sunmak ve geliştirmek için işleriz.' },
  { icon: Database, title: 'Kontrollü veri', text: 'Hesap, kullanım ve günlük verileri güvenli altyapıda saklanır.' },
  { icon: UserCheck, title: 'KVKK hakları', text: 'Verilerinize erişme, düzeltme ve silme taleplerinizi iletebilirsiniz.' },
];

const sections = [
  { title: '1. Giriş', body: 'Rüya Tabirleri olarak gizliliğinize saygı duyuyor ve kişisel verilerinizi korumayı taahhüt ediyoruz. Bu politika, web sitemizi kullandığınızda hangi bilgileri topladığımızı ve bu bilgileri nasıl kullandığımızı açıklar.' },
  { title: '2. Toplanan Bilgiler', body: 'Hesap oluşturduğunuzda e-posta adresi, kullanıcı adı ve isteğe bağlı profil bilgileri toplanabilir. Sitemizi kullandığınızda arama sorguları, görüntülenen sayfalar, favoriler ve rüya günlüğü içerikleri hizmetin çalışması için işlenebilir.' },
  { title: '3. Bilgilerin Kullanımı', body: 'Verileri hesabınızı yönetmek, kişiselleştirilmiş deneyim sunmak, site performansını iyileştirmek, güvenliği sağlamak ve kötüye kullanımı önlemek amacıyla kullanırız.' },
  { title: '4. Bilgi Paylaşımı', body: 'Kişisel bilgilerinizi üçüncü taraflarla satmaz veya kiralamayız. Yalnızca yasal zorunluluklar, hizmet sağlayıcılarla teknik işlem ihtiyaçları veya açık izniniz olduğunda paylaşım yapılabilir.' },
  { title: '5. Çerezler', body: 'Deneyiminizi iyileştirmek ve oturum sürekliliğini sağlamak için çerezler kullanılabilir. Tarayıcı ayarlarınızdan çerezleri yönetebilir veya devre dışı bırakabilirsiniz.' },
  { title: '6. Veri Güvenliği', body: 'Verilerinizi korumak için endüstri standardı güvenlik önlemleri kullanırız. İnternet üzerinden hiçbir aktarımın yüzde yüz güvenli olmadığını da şeffaf biçimde belirtiriz.' },
  { title: '7. Haklarınız', body: 'KVKK kapsamında verilerinize erişme, düzeltilmesini talep etme, silinmesini isteme ve veri işlemeye itiraz etme haklarına sahipsiniz.' },
  { title: '8. Değişiklikler', body: 'Bu gizlilik politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler olduğunda kullanıcıları uygun kanallardan bilgilendiririz.' },
];

export default function Privacy() {
  return (
    <Layout>
      <Seo
        title="Gizlilik Politikası"
        description="Rüya Tabirleri gizlilik politikası. Kişisel verilerinizin nasıl korunduğunu öğrenin."
        path="/gizlilik"
      />
      <div className="relative overflow-hidden bg-mesh">
        <div className="absolute -top-40 right-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-96 -left-40 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

        <section className="container relative py-14 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <PremiumBadge>
                <Shield className="h-3.5 w-3.5" />
                Gizlilik ve güvenlik
              </PremiumBadge>
            </div>
            <h1 className="mb-5 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Verileriniz için <GradientText>şeffaf</GradientText> bir politika.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Hangi verileri neden kullandığımızı açıkça anlatıyoruz. Rüya günlüğünüz, hesabınız ve kullanım verileriniz sizin kontrolünüzdedir.
            </p>
            <p className="mt-5 text-sm font-medium text-muted-foreground">Son güncelleme: Haziran 2026</p>
          </div>
        </section>

        <section className="container relative pb-10">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="surface border-border/70">
                  <CardContent className="p-5">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mb-2 font-bold">{item.title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="container relative pb-20">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-3xl border border-border/70 bg-card/80 p-5 shadow-lg backdrop-blur lg:sticky lg:top-24">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <EyeOff className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Kısa Özet</h2>
                  <p className="text-xs text-muted-foreground">Gizlilik prensipleri</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                {['Veri satışı yapmayız', 'Günlük içerikleri kullanıcıya aittir', 'Yasal haklarınızı kullanabilirsiniz'].map((item) => (
                  <div key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <a href="mailto:info@ruyatabirleri.com" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Mail className="h-4 w-4" />
                Gizlilik sorusu gönder
              </a>
            </aside>

            <Card className="surface border-border/70">
              <CardContent className="p-6 md:p-8">
                <div className="space-y-5">
                  {sections.map((section) => (
                    <section key={section.title} className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                        <Cookie className="h-4 w-4 text-primary" />
                        {section.title}
                      </h2>
                      <p className="leading-relaxed text-muted-foreground">{section.body}</p>
                    </section>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
}
