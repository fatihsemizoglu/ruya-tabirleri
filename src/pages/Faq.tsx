import { Layout } from '@/components/layout/Layout';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Moon, HelpCircle, Search, Sparkles, BookOpen, Library, MessageCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/Seo';
import { Link } from 'react-router-dom';
import { absoluteUrl } from '@/lib/site';

interface FaqItem {
  question: string;
  answer: string;
}

const faqItems: FaqItem[] = [
  {
    question: 'Rüya tabiri nedir ve rüyaların anlamı var mıdır?',
    answer:
      'Rüya tabiri, rüyada görülen sembollerin ve olayların geleneksel, İslami ve psikolojik açıdan yorumlanmasıdır. Rüyaların tek bir kesin anlamı olmamakla birlikte, semboller binlerce yıllık kültürel birikim içinde belirli anlamlar kazanmıştır. Sitemizde her rüya tabiri hem geleneksel kaynaklara hem de modern psikolojiye dayanan dengeli bir yaklaşımla sunulur.',
  },
  {
    question: 'Rüyada yılan görmek ne anlama gelir?',
    answer:
      'Rüyada yılan görmek en yaygın rüya sembollerinden biridir. Geleneksel yorumlara göre yılan; gizli düşmanlık, tehlike veya korkuya işaret edebilir. Psikolojik yorumlarda ise yılan genellikle bilinçaltındaki korkuları, bastırılmış duyguları veya dönüşümü temsil eder. Rüyanın detayları (yılanın rengi, durumu, size karşı davranışı) yorumu önemli ölçüde değiştirir.',
  },
  {
    question: 'Rüyalar neden görülür? Bilimsel açıklaması nedir?',
    answer:
      'Bilimsel olarak rüyalar, uykunun REM (hızlı göz hareketi) evresinde beynin bilgi işleme ve duygusal düzenleme süreçlerinin bir sonucudur. Uzmanlara göre rüyalar; günlük deneyimlerin işlenmesi, anıların pekiştirilmesi ve duygusal sorunların çözümlenmesine yardımcı olur. Sigmund Freud ve Carl Jung gibi psikologlara göre rüyalar bilinçaltının bir yansımasıdır.',
  },
  {
    question: 'Rüya tabirleri gerçekten doğru mu?',
    answer:
      'Rüya tabirleri kesin birer kehanet değil, sembolik anlam kılavuzlarıdır. Aynı sembol farklı kişiler için farklı anlamlar taşıyabilir; çünkü rüya yorumunda kişisel yaşam deneyimleri, duygular ve kültürel bağlam büyük rol oynar. Bu nedenle tabirleri bir yol gösterici olarak değerlendirmek, tek mutlak cevap olarak görmemek en sağlıklı yaklaşımdır.',
  },
  {
    question: 'İslami rüya tabirlerinde nelere dikkat edilir?',
    answer:
      'İslami rüya tabiri geleneğinde rüyalar; sadık rüya (gerçek), karışık rüya ve şeytani rüya olarak üçe ayrılır. Alimlere göre yorumda rüyanın zamanı, gören kişinin durumu ve sembollerin Kur\u2019an ve hadislerdeki karşılıkları dikkate alınır. Güzel rüyaların Allah\u2019tan, kötü rüyaların şeytandan olduğu kabul edilir; kötü rüyaların kimseye anlatılmaması tavsiye edilir.',
  },
  {
    question: 'Rüyamı nasıl daha iyi hatırlayabilirim?',
    answer:
      'Rüyaları hatırlamak için en etkili yöntem, uyanır uyanmaz rüyayı not etmektir. Yatak başında bir rüya günlüğü bulundurmak, uyku düzenini korumak ve uyanır uyanmaz gözleri açmadan birkaç dakika rüyayı zihinde canlandırmak hatırlama oranını ciddi şekilde artırır. Sitemizdeki kişisel rüya günlüğü özelliğiyle rüyalarınızı kaydedebilir, zaman içindeki temaları takip edebilirsiniz.',
  },
  {
    question: 'Rüya günlüğü tutmak ne işe yarar?',
    answer:
      'Rüya günlüğü; rüya tekrarlarını, sembol eğilimlerini ve duygusal örüntüleri fark etmenizi sağlar. Zamanla hangi durumların belirli rüyaları tetiklediğini görebilir, kişisel gelişiminizde rüyalarınızı bir iç görü kaynağı olarak kullanabilirsiniz. Günlüğünüzü düzenli tutmak aynı zamanda rüya hatırlama becerinizi de geliştirir.',
  },
  {
    question: 'Rüyalar geleceği haber verir mi?',
    answer:
      'Bu konuda görüşler farklıdır. Bazı geleneksel yorumlar rüyaların ilahi bir işaret veya sezgi olabileceğini kabul ederken, bilimsel yaklaşım rüyaların geleceği önceden bildirdiğine dair kanıt bulamamıştır. Rüyaların çoğu zaman günlük yaşamın, kaygıların ve umutların yansıması olduğu kabul edilir. Rüya yorumlarını rehber olarak almak, hayat kararlarını yalnızca rüyaya göre vermemek önemlidir.',
  },
  {
    question: 'Aynı rüyayı defalarca görmek ne anlama gelir?',
    answer:
      'Tekrarlayan rüyalar, çözülmemiş bir soruna veya bastırılmış bir duyguya işaret edebilir. Psikolojiye göre zihin, çözümlenmemiş bir konuyu rüya yoluyla tekrar tekrar gündeme getirir. Bu tür rüyaların neden tekrarlandığını anlamak için rüyanın duygusal tonunu ve günlük hayatınızdaki tetikleyicileri incelemek faydalı olabilir.',
  },
  {
    question: 'Rüyada ölüm görmek kötü müdür?',
    answer:
      'Rüyada ölüm görmek, çoğu kültürde ve geleneksel tabirlerde ölümle doğrudan ilişkili değildir. Genellikle bir değişimin, yeniden doğuşun, eski bir dönemin kapanıp yenisinin başlamasının sembolüdür. Psikolojik olarak da ölüm rüyaları, hayatınızda tamamlanmış veya tamamlanması gereken bir dönüşümü yansıtabilir.',
  },
  {
    question: 'Rüya tabiri sayfasını nasıl kullanırım?',
    answer:
      'Ana sayfadaki arama kutusuna rüyanızda gördüğünüz sembolü yazarak binlerce tabir arasında arama yapabilirsiniz. Kategoriler, alfabetik liste ve popüler rüyalar bölümleriyle de keşfe devam edebilirsiniz. Ayrıca giriş yaparak rüya günlüğü tutabilir, favorilerinize ekleyebilir ve rüyalarınızı karşılaştırabilirsiniz.',
  },
  {
    question: 'Rüya yorumlarına inanmalı mıyım?',
    answer:
      'Rüya yorumlarına yaklaşım kişisel bir tercihtir. Rüyaların bilinçaltınız hakkında değerli ipuçları sunduğu geniş kabul görür. Tabirlerimizi bir keşif aracı olarak kullanabilir, kendi sezgilerinizle birleştirebilirsiniz. Ancak rüya yorumlarının tıbbi, hukuki veya finansal kararlara temel oluşturmaması gerektiğini unutmayın.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: absoluteUrl('/') },
    { '@type': 'ListItem', position: 2, name: 'Sıkça Sorulan Sorular', item: absoluteUrl('/sss') },
  ],
};

export default function Faq() {
  return (
    <Layout>
      <Seo
        title="Sıkça Sorulan Sorular"
        description="Rüya tabiri hakkında en çok merak edilen soruların cevapları: Rüyalar neden görülür, yılan görmek ne anlama gelir, rüya günlüğü nasıl tutulur ve daha fazlası."
        path="/sss"
        jsonLd={[jsonLd, breadcrumbLd]}
      />
      <div className="relative overflow-hidden bg-mesh">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute top-80 -left-40 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <section className="container relative py-14 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <PremiumBadge>
                <HelpCircle className="h-3.5 w-3.5" />
                Merak ettikleriniz
              </PremiumBadge>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Rüyalar Hakkında <GradientText>Sık Sorulanlar</GradientText>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Rüya tabiri, rüya bilimi ve sitemizin kullanımıyla ilgili en çok merak edilen soruların
              cevaplarını derledik.
            </p>
          </div>
        </section>

        <section className="container relative pb-16">
          <div className="mx-auto grid max-w-5xl gap-4">
            {faqItems.map((item, index) => (
              <Card key={item.question} className="surface overflow-hidden border-border/70">
                <details className="group">
                  <summary className="flex cursor-pointer select-none items-center gap-3 p-5 transition-colors hover:bg-muted/30 md:p-6">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-600 dark:text-violet-400">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-semibold text-foreground md:text-lg">{item.question}</span>
                    <Sparkles className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
                  </summary>
                  <CardContent className="px-5 pb-5 md:px-6 md:pb-6">
                    <div className="border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
                      {item.answer}
                    </div>
                  </CardContent>
                </details>
              </Card>
            ))}
          </div>
        </section>

        <section className="container relative pb-20">
          <div className="mx-auto max-w-5xl">
            <Card className="surface border-border/70">
              <CardContent className="p-6 md:p-8">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Search className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-bold">Rüya Ara</h3>
                      <p className="text-sm text-muted-foreground">Binlerce tabir arasında hızlı arama</p>
                    </div>
                    <Link
                      to="/ara"
                      className="inline-flex items-center min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Aramaya Başla
                    </Link>
                  </div>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-bold">Kategoriler</h3>
                      <p className="text-sm text-muted-foreground">Temalara göre rüya tabirleri</p>
                    </div>
                    <Link
                      to="/kategoriler"
                      className="inline-flex items-center min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Kategorileri Gör
                    </Link>
                  </div>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Library className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-bold">Sembol Sözlüğü</h3>
                      <p className="text-sm text-muted-foreground">Alfabetik sembol listesi</p>
                    </div>
                    <Link
                      to="/semboller"
                      className="inline-flex items-center min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Sözlüğü Gör
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              Sorunuzun cevabını bulamadınız mı?{' '}
              <Link to="/iletisim" className="font-medium text-primary hover:underline">
                Bize ulaşın
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
