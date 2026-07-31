import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchWithDropdown } from '@/components/search/SearchWithDropdown';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

const popularSearches = [
  { label: 'Yılan', icon: '🐍' },
  { label: 'Su', icon: '💧' },
  { label: 'Uçmak', icon: '🕊️' },
  { label: 'Düşmek', icon: '⬇️' },
  { label: 'Düğün', icon: '💍' },
];

const stats = [
  { value: '5.000+', label: 'Rüya Tabiri' },
  { value: '1M+', label: 'Aylık Ziyaretçi' },
  { value: '4.9★', label: 'Kullanıcı Puanı' },
];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background"
      style={{
        minHeight: viewportHeight ? `${Math.max(viewportHeight - 64, 680)}px` : 'calc(100vh - 64px)',
      }}
    >
      {/* Background gradient mesh */}
      <div className="absolute inset-0 bg-mesh" />

      {/* Decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Top: Badge */}
      <div className="absolute top-24 sm:top-28 left-0 right-0 z-10">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs sm:text-sm font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Türkiye'nin en kapsamlı rüya tabirleri sitesi
            </div>
          </motion.div>
        </div>
      </div>

      {/* Center area: Title + Search bar (search is at exact viewport center) */}
      <div
        className="absolute left-0 right-0 top-[45%] z-20 -translate-y-1/2 px-4 sm:top-1/2"
      >
        <div className="max-w-3xl mx-auto">
          {/* Title above search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-4">
              <span className="block">Rüyalarınızın</span>
              <span className="text-gradient">Anlamını Keşfedin</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
              Binlerce rüya tabiri arasında arama yapın, İslami ve psikolojik yorumlarla rüyalarınızın anlamını öğrenin.
            </p>
          </motion.div>

          {/* The search bar - the main focal point */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <SearchWithDropdown variant="hero" />
          </motion.div>

          {/* Popular searches */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-5"
          >
            <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              Popüler:
            </span>
            {popularSearches.map((item) => (
              <Link
                key={item.label}
                to={`/ara?q=${encodeURIComponent(item.label)}`}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/80 border border-border/60 hover:border-primary/30 hover:bg-primary/5 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-all duration-200 backdrop-blur-sm"
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom: Alphabet + stats */}
      <div className="absolute bottom-4 left-0 right-0 z-10 sm:bottom-8">
        <div className="container px-4">
          {/* Alphabet navigation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-5"
          >
            <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 max-w-3xl mx-auto">
              {alphabet.map((letter, idx) => (
                <motion.div
                  key={letter}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.6 + idx * 0.012 }}
                >
                  <Link
                    to={`/az/${letter.toLowerCase()}`}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-card/70 border border-border/50 flex items-center justify-center text-[10px] sm:text-xs font-bold text-foreground transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-110 hover:shadow-md hover:shadow-primary/20 backdrop-blur-sm"
                  >
                    {letter}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center flex items-baseline gap-1.5">
                <span className="text-base sm:text-lg font-bold text-gradient">
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1"
        >
          <div className="w-1 h-1.5 rounded-full bg-muted-foreground/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
