import { useRef, useState, useEffect } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchWithDropdown } from '@/components/search/SearchWithDropdown';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

const popularSearches = [
  { label: 'Yılan' },
  { label: 'Su' },
  { label: 'Uçmak' },
  { label: 'Düşmek' },
  { label: 'Düğün' },
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
        minHeight: viewportHeight ? `${Math.max(viewportHeight - 64, 620)}px` : 'calc(100dvh - 64px)',
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
      <div className="absolute top-8 left-0 right-0 z-10 sm:top-16 md:top-24">
        <div className="container px-4">
          <div className="animate-in fade-in slide-in-from-top-2 text-center duration-500">
            <div className="inline-flex max-w-[calc(100vw-2rem)] items-center justify-center gap-2 rounded-full bg-primary/5 border border-primary/10 px-3 py-2 text-center text-[11px] font-semibold text-primary backdrop-blur-sm sm:px-4 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="truncate sm:whitespace-normal">Türkiye'nin en kapsamlı rüya tabirleri sitesi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center area: Title + Search bar (search is at exact viewport center) */}
      <div
        className="absolute left-0 right-0 top-[42%] z-20 -translate-y-1/2 px-4 sm:top-[46%] md:top-1/2"
      >
        <div className="max-w-3xl mx-auto">
          {/* Title above search */}
          <div className="animate-in fade-in slide-in-from-bottom-4 text-center duration-500 mb-4 sm:mb-6" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <h1 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.05] mb-3 sm:mb-4">
              <span className="block">Rüyalarınızın</span>
              <span className="text-gradient">Anlamını Keşfedin</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed px-1">
              Binlerce rüya tabiri arasında arama yapın, İslami ve psikolojik yorumlarla rüyalarınızın anlamını öğrenin.
            </p>
          </div>

          {/* The search bar - the main focal point */}
          <div className="animate-in fade-in slide-in-from-bottom-4 zoom-in-95 max-w-2xl mx-auto duration-500" style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}>
            <SearchWithDropdown variant="hero" />
          </div>

          {/* Popular searches */}
          <div className="animate-in fade-in mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2 duration-500" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
            <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              Popüler:
            </span>
            {popularSearches.map((item) => (
              <Link
                key={item.label}
                to={`/ara?q=${encodeURIComponent(item.label)}`}
                className="group inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:text-sm"
              >
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Alphabet + stats */}
      <div className="absolute bottom-3 left-0 right-0 z-10 sm:bottom-8">
        <div className="container px-4">
          {/* Alphabet navigation */}
          <div className="animate-in fade-in slide-in-from-bottom-2 mb-3 sm:mb-5 duration-500" style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}>
            <div className="mx-auto grid max-w-[21rem] grid-cols-9 justify-center gap-1 sm:flex sm:max-w-3xl sm:flex-wrap sm:gap-1.5">
              {alphabet.map((letter, idx) => (
                <div
                  key={letter}
                  className="animate-in fade-in zoom-in-90 duration-200"
                  style={{ animationDelay: `${600 + idx * 12}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Dokunmatik cihazlarda global min-width:48px kuralı bu 9 sütunlu
                      klavye-benzeri ızgarayı taşırabiliyor; min boyutları sıfırlayıp
                      yoğun ızgaralar için kompakt boyutta tutuyoruz.
                      data-audit-ignore: bilinçli olarak yoğun ızgara (klavye deseni). */}
                  <Link
                    to={`/az/${letter.toLowerCase()}`}
                    data-audit-ignore
                    className="flex h-8 w-8 min-w-0 min-h-0 items-center justify-center rounded-lg border border-border/50 bg-card/70 text-[11px] font-bold text-foreground backdrop-blur-sm transition-all active:scale-90 hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 sm:h-8 sm:w-8 sm:text-xs"
                  >
                    {letter}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-3 items-center justify-center gap-2 sm:flex sm:flex-wrap sm:gap-12 duration-500" style={{ animationDelay: '800ms', animationFillMode: 'backwards' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center flex flex-col items-center gap-0.5 sm:flex-row sm:items-baseline sm:gap-1.5">
                <span className="text-base sm:text-lg font-bold text-gradient">
                  {stat.value}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="animate-in fade-in absolute bottom-2 left-1/2 -translate-x-1/2 z-10 hidden lg:block duration-500"
        style={{ animationDelay: '1500ms', animationFillMode: 'backwards' }}
      >
        <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1 animate-bounce">
          <div className="w-1 h-1.5 rounded-full bg-muted-foreground/50" />
        </div>
      </div>
    </section>
  );
}
