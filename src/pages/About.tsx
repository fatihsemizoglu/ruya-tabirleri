import { Layout } from '@/components/layout/Layout';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Moon, Users, BookOpen, Heart, Shield, Sparkles, Compass, ScrollText, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

const values = [
  { icon: BookOpen, title: 'Kapsamlı Arşiv', description: 'Binlerce rüya tabiri, sembol ve kategoriyle hızlı keşif.', gradient: 'from-violet-500 to-purple-500' },
  { icon: Shield, title: 'Güvenilir Yaklaşım', description: 'İslami gelenek ve modern psikoloji dengesini koruyan yorumlar.', gradient: 'from-emerald-500 to-teal-500' },
  { icon: Users, title: 'Canlı Topluluk', description: 'Yorumlar, favoriler ve kişisel günlüklerle yaşayan bir deneyim.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Heart, title: 'Kişisel Yolculuk', description: 'Rüyalarınızı kaydedin, izleyin ve zaman içindeki temaları görün.', gradient: 'from-rose-500 to-pink-500' },
];

const milestones = [
  'Rüya sembollerini anlaşılır ve erişilebilir hale getirmek',
  'Geleneksel kaynakları modern kullanıcı deneyimiyle birleştirmek',
  'Kişisel rüya günlüğü ve favori özellikleriyle süreklilik sağlamak',
];

export default function About() {
  return (
    <Layout>
      <Seo
        title="Hakkımızda"
        description="Rüya Tabirleri, Türkiye'nin en kapsamlı rüya tabirleri sitesidir. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin."
        path="/hakkimizda"
      />
      <div className="relative overflow-hidden bg-mesh">
        <div className="absolute -top-40 right-0 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute top-80 -left-40 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <section className="container relative py-14 md:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 flex justify-center">
              <PremiumBadge>
                <Moon className="h-3.5 w-3.5" />
                Rüya dünyasına rehber
              </PremiumBadge>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Rüyalarınızı <GradientText>anlamlandıran</GradientText> sakin bir rehber.
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Rüya Tabirleri, geleneksel rüya yorumlarını modern arama, kişisel günlük ve topluluk deneyimiyle bir araya getiren kapsamlı bir keşif platformudur.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-3 gap-3 sm:gap-4">
            {[
              { value: '10K+', label: 'Kullanıcı' },
              { value: 'Binlerce', label: 'Rüya tabiri' },
              { value: '7/24', label: 'Erişim' },
            ].map((stat) => (
              <div key={stat.label} className="surface p-4 text-center backdrop-blur-md">
                <div className="text-xl font-bold sm:text-2xl">{stat.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="container relative pb-16">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="surface overflow-hidden border-border/70">
              <div className="h-1 dream-gradient" />
              <CardContent className="p-6 md:p-8">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Compass className="h-6 w-6" />
                </div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight">Misyonumuz</h2>
                <div className="space-y-4 leading-relaxed text-muted-foreground">
                  <p>
                    İnsanların rüyalarını daha bilinçli, sakin ve güvenilir bir çerçevede değerlendirmelerine yardımcı oluyoruz. Her rüyanın kişisel bağlamı olduğunu bilerek, farklı yorum geleneklerini anlaşılır bir dille sunuyoruz.
                  </p>
                  <p>
                    Amacımız tek bir kesin cevap vermek değil; rüyalarınızın sembollerini keşfetmenize, kendi duygularınızla bağlantı kurmanıza ve kişisel yolculuğunuzu kaydetmenize yardımcı olmak.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="surface border-border/70 p-6 md:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ScrollText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Hikayemiz</h2>
                  <p className="text-sm text-muted-foreground">Bir arşivden daha fazlası.</p>
                </div>
              </div>
              <div className="space-y-3">
                {milestones.map((item) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="container relative pb-20">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <PremiumBadge>
              <Sparkles className="h-3.5 w-3.5" />
              Neden bizi tercih etmelisiniz?
            </PremiumBadge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight">Anlamlı, hızlı ve kişisel.</h2>
          </div>
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-4">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="surface group overflow-hidden border-border/70 transition-all hover:-translate-y-1 hover:shadow-xl">
                  <CardContent className="p-6">
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg transition-transform group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-bold">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
}
