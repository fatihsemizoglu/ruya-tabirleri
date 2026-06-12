import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Search, BookOpen, Heart, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: "Rüya Tabirleri'ne Hoş Geldiniz!",
    description: "Türkiye'nin en kapsamlı rüya yorumları sitesine hoş geldiniz. Size kısa bir tur sunalım.",
    icon: <Moon className="h-8 w-8" />,
  },
  {
    id: 'search',
    title: 'Hızlı Arama',
    description: 'Arama kutusunu kullanarak binlerce rüya tabiri arasında anında arama yapabilirsiniz. Ctrl+K ile de açabilirsiniz.',
    icon: <Search className="h-8 w-8" />,
    target: '[data-search-input]',
  },
  {
    id: 'categories',
    title: 'Kategoriler',
    description: 'Rüyalarınızı kategorilere göre keşfedin. Hayvanlar, doğa, olaylar ve daha fazlası!',
    icon: <BookOpen className="h-8 w-8" />,
  },
  {
    id: 'favorites',
    title: 'Favoriler',
    description: 'Beğendiğiniz tabirleri favorilerinize ekleyerek daha sonra kolayca erişebilirsiniz.',
    icon: <Heart className="h-8 w-8" />,
  },
];

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('hasSeenOnboardingTour', 'true');
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = tourSteps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Mobile: bottom sheet | Desktop: centered modal */}
          <motion.div
            key="tour-card"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed z-[101] inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[calc(100%-2rem)] sm:max-w-md sm:px-0"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="relative flex max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl">
              {/* Drag handle (mobile only) */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              </div>

              {/* Gradient Header */}
              <div className="relative bg-gradient-to-br from-primary via-purple-600 to-pink-600 px-5 sm:px-6 py-6 sm:py-8 text-white shrink-0">
                <button
                  onClick={handleClose}
                  aria-label="Kapat"
                  className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-1.5 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 sm:gap-4 pr-10"
                >
                  <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
                    {step.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold leading-tight">{step.title}</h2>
                    <p className="text-xs sm:text-sm text-white/80">
                      Adım {currentStep + 1} / {tourSteps.length}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Content (scrollable if overflows) */}
              <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">
                <motion.p
                  key={`desc-${step.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed"
                >
                  {step.description}
                </motion.p>

                <div className="mt-5 sm:mt-6 flex justify-center gap-2">
                  {tourSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      aria-label={`${idx + 1}. adıma git`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentStep
                          ? 'w-6 bg-primary'
                          : 'w-2 bg-muted hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-5 sm:mt-6 flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Geri
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-muted-foreground"
                  >
                    Geç
                  </Button>

                  <Button size="sm" onClick={handleNext} className="gap-1">
                    {currentStep === tourSteps.length - 1 ? 'Başla' : 'İleri'}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
