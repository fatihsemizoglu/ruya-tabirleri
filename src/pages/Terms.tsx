import { Layout } from '@/components/layout/Layout';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { FileText, Scale, AlertTriangle, UserRoundCheck, Ban, Mail, CheckCircle2, BookOpen, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

const rules = [
  { icon: AlertTriangle, title: 'Bilgilendirme amaçlıdır', text: 'Rüya yorumları profesyonel tıbbi, psikolojik veya dini danışmanlık yerine geçmez.' },
  { icon: UserRoundCheck, title: 'Hesap güvenliği', text: 'Hesap bilgilerinizin doğruluğu ve şifrenizin güvenliği sizin sorumluluğunuzdadır.' },
  { icon: Ban, title: 'Uygunsuz kullanım yok', text: 'Spam, hakaret, otomatik veri toplama veya zarar verici davranışlar yasaktır.' },
];

const sections = [
  { title: '1. Kabul', body: 'Rüya Tabirleri web sitesini kullanarak bu kullanım koşullarını kabul etmiş sayılırsınız. Bu koşulları kabul etmiyorsanız siteyi kullanmamalısınız.' },
  { title: '2. Hizmet Tanımı', body: 'Rüya Tabirleri; rüya tabirleri, arama ve keşif özellikleri, kişisel rüya günlüğü ve favori listesi gibi özellikler sunan bir bilgi platformudur.' },
  { title: '3. Sorumluluk Reddi', body: 'Sitedeki rüya tabirleri yalnızca bilgi amaçlıdır. Profesyonel psikolojik, tıbbi veya dini danışmanlık yerine geçmez. İçeriklere dayanarak alacağınız kararların sorumluluğu size aittir.' },
  { title: '4. Hesap Oluşturma', body: 'Hesap oluştururken doğru ve güncel bilgiler sağlamayı, hesabınızı başkalarıyla paylaşmamayı ve hesabınızın güvenliğini korumayı kabul edersiniz.' },
  { title: '5. Kullanıcı İçeriği', body: 'Yorumlar, rüya günlüğü girişleri ve benzeri içeriklerinizin sorumluluğu size aittir. Yasadışı, hakaret içeren, spam veya uygunsuz içerik paylaşamazsınız.' },
  { title: '6. Fikri Mülkiyet', body: 'Site tasarımı, logosu, içerikleri ve yazılımı Rüya Tabirleri’ne aittir. İzinsiz kopyalama, dağıtma veya değiştirme yasaktır.' },
  { title: '7. Hizmet Değişiklikleri', body: 'Hizmetlerimizi önceden haber vermeksizin değiştirme, askıya alma veya sonlandırma hakkımız saklıdır.' },
  { title: '8. Hesap Sonlandırma', body: 'Kullanım koşullarını ihlal eden hesapları uyarı olmaksızın askıya alma veya silme hakkımız saklıdır.' },
  { title: '9. Sınırlı Sorumluluk', body: 'Rüya Tabirleri, site kullanımından doğabilecek doğrudan veya dolaylı zararlardan sorumlu tutulamaz.' },
  { title: '10. Uygulanacak Hukuk', body: 'Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir. Uyuşmazlıklar ilgili yetkili mahkemelerde çözümlenir.' },
  { title: '11. Değişiklikler', body: 'Bu kullanım koşullarını zaman zaman güncelleyebiliriz. Güncel versiyonu her zaman bu sayfada bulabilirsiniz.' },
];

export default function Terms() {
  return (
    <Layout>
      <Seo
        title="Kullanım Koşulları"
        description="Rüya Tabirleri kullanım koşulları. Siteyi kullanırken uyulması gereken kurallar."
        path="/kullanim-kosullari"
      />
      <div className="relative overflow-hidden bg-mesh">
        <div className="absolute -top-44 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute top-96 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <section className="container relative py-14 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <PremiumBadge>
                <FileText className="h-3.5 w-3.5" />
                Kullanım koşulları
              </PremiumBadge>
            </div>
            <h1 className="mb-5 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Platformu <GradientText>güvenle</GradientText> kullanmanız için.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Bu koşullar, Rüya Tabirleri deneyimini herkes için güvenli, saygılı ve sürdürülebilir tutmak amacıyla hazırlanmıştır.
            </p>
            <p className="mt-5 text-sm font-medium text-muted-foreground">Son güncelleme: Haziran 2026</p>
          </div>
        </section>

        <section className="container relative pb-10">
          <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
            {rules.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="surface border-border/70">
                  <CardContent className="p-5">
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
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
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold">Özet</h2>
                  <p className="text-xs text-muted-foreground">Temel kullanım prensipleri</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                {['Saygılı kullanım', 'Bilgilendirme amaçlı içerik', 'Hesap güvenliği sorumluluğu'].map((item) => (
                  <div key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <a href="mailto:info@ruyatabirleri.com" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Mail className="h-4 w-4" />
                Koşullar hakkında yazın
              </a>
            </aside>

            <Card className="surface border-border/70">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <div className="mb-2 flex items-center gap-2 font-bold">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Önemli bilgilendirme
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    Rüya yorumları kişisel ve kültürel bağlama göre değişebilir. Platformdaki bilgiler karar destek niteliğindedir; uzman görüşü yerine geçmez.
                  </p>
                </div>

                <div className="space-y-5">
                  {sections.map((section) => (
                    <section key={section.title} className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                        <BookOpen className="h-4 w-4 text-primary" />
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
