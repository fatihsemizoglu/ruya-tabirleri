import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Sparkles, Star, Moon, ArrowRight } from 'lucide-react';
import { SearchWithDropdown } from '@/components/search/SearchWithDropdown';
import { Typewriter } from '@/components/ui/typewriter';
import { ParticleField } from '@/components/ui/particle-field';
import { dreamsApi } from '@/lib/api';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');
const firstRow = alphabet.slice(0, 15);
const secondRow = alphabet.slice(15);

const popularSearches = [
  'Yılan görmek',
  'Su görmek',
  'Ölüm görmek',
  'Uçmak',
  'Düşmek',
];

const typewriterWords = [
  'gizemini çözün.',
  'anlamını keşfedin.',
  'mesajlarını okuyun.',
  'rüyalarınızı yorumlayın.',
  'geleceğinizi öğrenin.',
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
        <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-xs xs:text-sm md:text-base font-semibold rounded-md sm:rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm group-hover:bg-indigo-600 text-slate-700 dark:text-slate-300 group-hover:text-white border border-slate-200/50 dark:border-slate-700/50 group-hover:border-indigo-600 shadow-sm group-hover:shadow-md group-hover:shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center">
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
    <section ref={sectionRef} className="relative overflow-hidden py-12 sm:py-16 md:py-20 lg:py-24">
      {/* Mystical Deep Background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950"
        style={{ y: backgroundY }}
      />
       
      {/* Animated Mystical Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Particle Field */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: starsY }}
      >
        <ParticleField count={60} color="rgba(139, 92, 246, 0.15)" maxSize={2} speed={0.2} />
      </motion.div>

      {/* Content */}
      <div className="relative container px-4 mx-auto">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm text-indigo-600 dark:text-indigo-300 text-[11px] sm:text-xs font-semibold tracking-wider uppercase mb-8"
          >
            <Sparkles className="h-3 w-3 animate-pulse text-purple-500" />
            <span>Rüyalarınızın Gizemini Keşfedin</span>
            <Sparkles className="h-3 w-3 animate-pulse text-indigo-500" />
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="text-slate-900 dark:text-white drop-shadow-sm">Rüyalarınızın</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 dark:from-indigo-400 dark:via-purple-300 dark:to-indigo-400 animate-gradient-x py-2 inline-block">
              Dilini Çözün
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Binlerce rüya tabiri arasında arama yapın.{' '}
            <span className="text-indigo-600 dark:text-indigo-300 font-medium">
              Rüyalarınız size ne{' '}
              <Typewriter 
                words={['anlatıyor?', 'fısıldıyor?', 'gösteriyor?', 'vadediyor?']} 
                typingSpeed={80} 
                deletingSpeed={40} 
                pauseDuration={2000}
              />
            </span>
          </motion.p>

          {/* Alphabet Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-10"
          >
            <div className="flex flex-col gap-3">
              <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                {firstRow.map((letter, index) => (
                  <AlphabetButton key={letter} letter={letter} index={index} delayOffset={0.4} />
                ))}
              </div>
              <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap">
                {secondRow.map((letter, index) => (
                  <AlphabetButton key={letter} letter={letter} index={index} delayOffset={0.45} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Search Form */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-2xl mx-auto mb-10 relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
            <SearchWithDropdown variant="hero" />
          </motion.div>

          {/* Popular Searches */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex flex-wrap justify-center gap-2">
              {popularSearches.map((term, index) => (
                <motion.button
                  key={term}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickSearch(term)}
                  className="px-4 py-2 text-[11px] sm:text-xs font-semibold rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-indigo-600 text-slate-600 dark:text-slate-400 hover:text-white border border-slate-200 dark:border-white/10 hover:border-indigo-600 transition-all duration-300 uppercase tracking-widest shadow-sm"
                >
                  {term}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
