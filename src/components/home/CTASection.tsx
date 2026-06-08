import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Bell,
  Heart,
  BarChart3,
  Quote,
  Lock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: BookOpen,
    title: 'Kişisel rüya günlüğü',
    description: 'Tüm rüyalarınız tek bir yerde, güvenle.',
  },
  {
    icon: Heart,
    title: 'Favori tabirleri kaydetme',
    description: 'Beğendiğiniz tabirleri kolayca kaydedin.',
  },
  {
    icon: Bell,
    title: 'Rüya hatırlatıcıları',
    description: 'Sabah uyanınca rüyalarınızı yazın.',
  },
  {
    icon: BarChart3,
    title: 'Kişiselleştirilmiş öneriler',
    description: 'Rüya kalıplarınıza göre içerik önerileri.',
  },
];

const previewEntries = [
  {
    date: 'Bu sabah · 06:42',
    title: 'Deniz kenarında yürüyüş',
    mood: 'Huzurlu',
    moodColor: 'from-emerald-400 to-teal-500',
    excerpt: 'Sahilde ılık bir rüzgar vardı, ayaklarım suyun içindeydi...',
  },
  {
    date: 'Dün · 05:18',
    title: 'Uçtuğum bir rüya',
    mood: 'Heyecanlı',
    moodColor: 'from-amber-400 to-orange-500',
    excerpt: 'Şehrin üzerinden süzülüyordum, her şey çok küçüktü...',
  },
  {
    date: '2 gün önce · 07:11',
    title: 'Eski evde kaybolmak',
    mood: 'Meraklı',
    moodColor: 'from-violet-400 to-fuchsia-500',
    excerpt: 'Tanıdık koridorlar ama her kapı başka bir yere açılıyordu...',
  },
];

export function CTASection() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 right-1/4 w-[520px] h-[520px] bg-fuchsia-500/10 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="container relative py-20 md:py-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT — content */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs sm:text-sm font-semibold mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {user ? 'Premium Özellikler' : 'Ücretsiz Başlayın'}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] text-foreground leading-[1.05] mb-5"
            >
              {user ? 'Rüya Günlüğünüzü' : 'Hemen Katılın,'}
              <br />
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                {user ? 'Tutmaya Başlayın' : 'Ayrıcalıkları Keşfedin'}
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="text-muted-foreground text-base md:text-lg mb-10 max-w-xl leading-relaxed"
            >
              {user
                ? 'Gördüğünüz rüyaları kaydedin, zaman içinde kalıplarınızı keşfedin ve kişisel yorumlarınızı ekleyin.'
                : 'Rüya günlüğü tutun, favorilerinizi kaydedin ve kişiselleştirilmiş öneriler alın.'}
            </motion.p>

            {/* Features list */}
            <motion.ul
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-50px' }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
              }}
              className="space-y-3 mb-10"
            >
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <motion.li
                    key={feature.title}
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.4 } },
                    }}
                    className="group flex items-start gap-4"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/15 via-fuchsia-500/15 to-pink-500/15 border border-violet-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                    </div>
                    <div className="pt-0.5">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground leading-tight">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              {user ? (
                <Button
                  size="lg"
                  asChild
                  className="relative h-12 px-7 rounded-xl text-sm sm:text-base font-semibold text-white border-0 shadow-lg shadow-fuchsia-500/25 group overflow-hidden"
                >
                  <Link to="/profil?tab=gunluk">
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <BookOpen className="relative h-4 w-4 mr-2" />
                    <span className="relative">Günlüğe Git</span>
                    <ArrowRight className="relative h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    asChild
                    className="relative h-12 px-7 rounded-xl text-sm sm:text-base font-semibold text-white border-0 shadow-lg shadow-fuchsia-500/25 group overflow-hidden"
                  >
                    <Link to="/kayit">
                      <span className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                      <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Sparkles className="relative h-4 w-4 mr-2" />
                      <span className="relative">Ücretsiz Kayıt Ol</span>
                      <ArrowRight className="relative h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="h-12 px-7 rounded-xl text-sm sm:text-base font-semibold border-border hover:bg-muted"
                  >
                    <Link to="/giris">Giriş Yap</Link>
                  </Button>
                </>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground sm:ml-2">
                <Lock className="h-3 w-3" />
                <span>Verileriniz güvende · KVKK uyumlu</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT — preview mockup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            <JournalPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function JournalPreview() {
  return (
    <div className="relative">
      {/* Glow behind the card */}
      <div className="absolute -inset-6 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-[2rem] blur-3xl opacity-60" />

      <div className="relative">
        {/* Main journal card */}
        <div className="relative bg-card/90 backdrop-blur-xl border border-border/60 rounded-3xl p-5 sm:p-6 shadow-2xl">
          {/* Card header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Rüya Günlüğüm</h3>
                <p className="text-[11px] text-muted-foreground">Son 7 gün · 12 rüya</p>
              </div>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium hidden sm:block">
              {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="rounded-xl bg-gradient-to-br from-violet-500/8 to-violet-500/3 border border-violet-500/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-400 font-semibold">Rüya</p>
              <p className="text-lg font-bold text-foreground mt-0.5">128</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-fuchsia-500/8 to-fuchsia-500/3 border border-fuchsia-500/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400 font-semibold">Favori</p>
              <p className="text-lg font-bold text-foreground mt-0.5">34</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-pink-500/8 to-pink-500/3 border border-pink-500/15 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-pink-600 dark:text-pink-400 font-semibold">Seri</p>
              <p className="text-lg font-bold text-foreground mt-0.5">
                7<span className="text-xs text-muted-foreground font-medium ml-0.5">gün</span>
              </p>
            </div>
          </div>

          {/* Entries list */}
          <div className="space-y-2.5">
            {previewEntries.map((entry, idx) => (
              <div
                key={entry.title}
                className="group/entry relative rounded-2xl border border-border/40 bg-muted/30 hover:bg-muted/60 transition-colors p-3.5"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-9 h-9 rounded-lg bg-gradient-to-br ${entry.moodColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Quote className="h-4 w-4 text-white/90" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {entry.date}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${entry.moodColor} text-white`}>
                        {entry.mood}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-foreground leading-snug">
                      {entry.title}
                    </h4>
                    <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">
                      {entry.excerpt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA inside card */}
          <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Tüm rüyalarınız tek bir yerde
            </p>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400">
              <span>Tümünü gör</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>

        {/* Floating notification card (top-right) */}
        <motion.div
          initial={{ opacity: 0, y: -10, x: 10 }}
          whileInView={{ opacity: 1, y: 0, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="hidden md:flex absolute -top-4 -right-4 lg:-right-6 items-center gap-2.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-border/60 rounded-2xl shadow-xl"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">Rüya hatırlatıcı</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Yeni rüya kaydet</p>
          </div>
        </motion.div>

        {/* Floating streak card (bottom-left) */}
        <motion.div
          initial={{ opacity: 0, y: 10, x: -10 }}
          whileInView={{ opacity: 1, y: 0, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="hidden md:flex absolute -bottom-5 -left-4 lg:-left-8 items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-border/60 rounded-2xl shadow-xl"
        >
          <div className="flex -space-x-1">
            <span className="w-2 h-6 rounded-full bg-emerald-500" />
            <span className="w-2 h-6 rounded-full bg-emerald-500" />
            <span className="w-2 h-6 rounded-full bg-emerald-500" />
            <span className="w-2 h-6 rounded-full bg-emerald-500" />
            <span className="w-2 h-6 rounded-full bg-emerald-500" />
            <span className="w-2 h-6 rounded-full bg-emerald-500" />
            <span className="w-2 h-6 rounded-full bg-emerald-200" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">7 günlük seri</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Hedef: 30 gün</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
