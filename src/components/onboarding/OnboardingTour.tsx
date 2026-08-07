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
  if (!step || !isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:bottom-6 sm:right-6 sm:w-96 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-5 sm:p-6 text-white shadow-2xl"
      >
        <button
          onClick={handleClose}
          aria-label="Kapat"
          className="absolute right-3 top-3 sm:right-4 sm:top-4 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 sm:gap-4 pr-10">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
            {step.icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold leading-tight">{step.title}</h2>
            <p className="text-xs sm:text-sm text-white/80">
              Adım {currentStep + 1} / {tourSteps.length}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain">
          <motion.p
            key={`desc-${step.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm sm:text-base text-white/90 leading-relaxed"
          >
            {step.description}
          </motion.p>

          <div className="mt-5 sm:mt-6 flex justify-center gap-2">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                aria-label={`${idx + 1}. adıma git`}
                aria-current={idx === currentStep ? 'step' : undefined}
                className="group -m-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10"
              >
                <span
                  aria-hidden="true"
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/40 group-hover:bg-white/60'
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="mt-5 sm:mt-6 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1 text-white hover:bg-white/20 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              Geri
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white/80 hover:bg-white/20 hover:text-white"
            >
              Geç
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              className="gap-1 bg-white text-violet-700 hover:bg-white/90"
            >
              {currentStep === tourSteps.length - 1 ? 'Başla' : 'İleri'}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
