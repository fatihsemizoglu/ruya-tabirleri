import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Star, Moon, ArrowRight } from 'lucide-react';
import { SearchWithDropdown } from '@/components/search/SearchWithDropdown';
import { dreamsApi } from '@/lib/api';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');
const firstRow = alphabet.slice(0, 15);
const secondRow = alphabet.slice(15);

const popularSearches = [
  'Yılan görmek',
  'Su görmek',
  'Ölüm görmek',
  'Düğün görmek',
  'Uçmak',
  'Düşmek',
];

type LetterCounts = Record<string, number>;

export function HeroSection() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const [letterCounts, setLetterCounts] = useState<LetterCounts>({});
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Fetch dream counts per letter
  useEffect(() => {
    const fetchLetterCounts = async () => {
      const response = await dreamsApi.getAll({ is_published: true });
      
      if (response.success && response.data) {
        const counts: LetterCounts = {};
        response.data.forEach((dream: { title: string }) => {
          const firstLetter = dream.title.charAt(0).toUpperCase();
          // Handle Turkish characters
          const normalizedLetter = firstLetter === 'I' ? 'I' : firstLetter;
          counts[normalizedLetter] = (counts[normalizedLetter] || 0) + 1;
        });
        setLetterCounts(counts);
      }
    };
    
    fetchLetterCounts();
  }, []);

  // Parallax transforms for different layers
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const orbsY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const starsY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const mistY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);

  const handleQuickSearch = (term: string) => {
    navigate(`/ara?q=${encodeURIComponent(term)}`);
  };

  const AlphabetButton = ({ letter, index, delayOffset }: { letter: string; index: number; delayOffset: number }) => {
    const count = letterCounts[letter] || 0;
    
    return (
      <motion.button
        key={letter}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: delayOffset + index * 0.02 }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(`/az/${letter.toLowerCase()}`)}
        className="relative flex flex-col items-center group"
      >
        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-xs xs:text-sm md:text-base font-semibold rounded-md sm:rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm group-hover:bg-indigo-600 text-slate-700 dark:text-slate-300 group-hover:text-white border border-slate-200/50 dark:border-slate-700/50 group-hover:border-indigo-600 shadow-sm group-hover:shadow-md group-hover:shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center">
          {letter}
        </div>
        {count > 0 && (
          <span className="absolute -bottom-3 xs:-bottom-3.5 sm:-bottom-4 text-[8px] xs:text-[9px] sm:text-[10px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {count}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-[85vh] sm:min-h-[90vh] flex items-center">
      {/* Modern Gradient Background - Parallax Layer 1 */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/50 to-purple-50/30 dark:from-slate-950 dark:via-indigo-950/50 dark:to-purple-950/30"
        style={{ y: backgroundY }}
      />
      
      {/* Mesh Gradient Overlays - Parallax Layer 2 */}
      <motion.div className="absolute inset-0" style={{ y: backgroundY }}>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_80%_100%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
      </motion.div>
      
      {/* Animated Gradient Orbs - Parallax Layer 3 (faster) - Hidden on small mobile */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block"
        style={{ y: orbsY }}
      >
        <div className="absolute -top-40 -right-40 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-gradient-to-br from-indigo-400/20 via-purple-400/15 to-pink-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-gradient-to-tr from-blue-400/15 via-indigo-400/10 to-violet-400/5 rounded-full blur-3xl animate-float animation-delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] md:w-[800px] h-[500px] md:h-[800px] bg-gradient-to-r from-transparent via-indigo-200/10 to-transparent rounded-full blur-3xl" />
      </motion.div>

      {/* Floating Stars & Moons - Parallax Layer 4 - Reduced on mobile */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block"
        style={{ y: starsY }}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            <Star 
              className="w-3 h-3 md:w-4 md:h-4 text-indigo-400/30 animate-pulse" 
              style={{ animationDuration: `${3 + i}s` }}
            />
          </div>
        ))}
        {[...Array(4)].map((_, i) => (
          <div
            key={`moon-${i}`}
            className="absolute opacity-20"
            style={{
              right: `${10 + i * 20}%`,
              top: `${15 + i * 20}%`,
            }}
          >
            <Moon 
              className="w-5 h-5 md:w-6 md:h-6 text-purple-400 animate-float" 
              style={{ animationDelay: `${i * 0.7}s` }}
            />
          </div>
        ))}
      </motion.div>
      
      {/* Drifting Mist - Parallax Layer 5 - Hidden on mobile for performance */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block"
        style={{ y: mistY }}
      >
        <div className="absolute top-1/4 -left-1/4 w-[60%] h-[40%] bg-gradient-to-r from-transparent via-indigo-300/10 to-transparent rounded-full blur-3xl animate-drift-slow" />
        <div className="absolute top-1/2 -left-1/3 w-[70%] h-[30%] bg-gradient-to-r from-transparent via-purple-300/8 to-transparent rounded-full blur-3xl animate-drift-slow" style={{ animationDelay: '-15s' }} />
        <div className="absolute top-1/3 w-[55%] h-[25%] bg-gradient-to-l from-transparent via-pink-300/8 to-transparent rounded-full blur-3xl animate-drift-slower" />
      </motion.div>

      {/* Content - Parallax Layer 6 (slowest) */}
      <motion.div 
        className="container relative px-4 sm:px-6 py-12 sm:py-16 md:py-28 lg:py-36"
        style={{ y: contentY }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge - Smaller on mobile */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg shadow-indigo-500/10 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold -mt-4 sm:-mt-6 mb-4"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Türkiye'nin en kapsamlı rüya tabirleri sitesi</span>
            <span className="xs:hidden">En kapsamlı rüya tabirleri</span>
          </motion.div>

          {/* Title - Responsive sizing */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 tracking-tight"
          >
            <span className="text-slate-900 dark:text-white">Rüyalarınızın</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Anlamını Keşfedin
            </span>
          </motion.h1>

          {/* Subtitle - Responsive */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2"
          >
            <span className="hidden sm:inline">Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla </span>
            <span className="sm:hidden">İslami ve psikolojik yorumlarla </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">rüyalarınızın gizemini </span>
            çözün.
          </motion.p>

          {/* Alphabet Navigation - Compact on mobile with counts */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="max-w-2xl mx-auto mb-6 sm:mb-8 px-1"
          >
            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 flex-wrap">
                {firstRow.map((letter, index) => (
                  <AlphabetButton key={letter} letter={letter} index={index} delayOffset={0.4} />
                ))}
              </div>
              <div className="flex justify-center gap-1 xs:gap-1.5 sm:gap-2 flex-wrap">
                {secondRow.map((letter, index) => (
                  <AlphabetButton key={letter} letter={letter} index={index} delayOffset={0.45} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Search Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 px-2"
          >
            <SearchWithDropdown variant="hero" />
          </motion.div>

          {/* Popular Searches - Scrollable on mobile */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="px-2"
          >
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4 font-medium">Popüler aramalar</p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {popularSearches.map((term, index) => (
                <motion.button
                  key={term}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickSearch(term)}
                  className="group px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:bg-indigo-600 text-slate-700 dark:text-slate-300 hover:text-white border border-slate-200 dark:border-slate-700 hover:border-indigo-600 shadow-sm hover:shadow-lg hover:shadow-indigo-500/25 transition-colors duration-300"
                >
                  {term}
                  <ArrowRight className="hidden sm:inline-block ml-1 w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </motion.button>
              ))}
            </div>
          </motion.div>

        </div>
      </motion.div>
    </section>
  );
}

