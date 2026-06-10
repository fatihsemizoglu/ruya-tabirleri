import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Search, BookOpen, Heart, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector for highlighting
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Rüya Tabirleri\'ne Hoş Geldiniz!',
    description: 'Türkiye\'nin en kapsamlı rüya yorumları sitesine hoş geldiniz. Size kısa bir tur sunalım.',
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
    // Check if user has seen the tour
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour) {
      // Delay showing the tour to allow page to load
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Tour Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="relative overflow-hidden rounded-3xl bg-card shadow-2xl">
              {/* Gradient Header */}
              <div className="relative bg-gradient-to-br from-primary via-purple-600 to-pink-600 px-6 py-8 text-white">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    {step.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{step.title}</h2>
                    <p className="text-sm text-white/80">
                      Adım {currentStep + 1} / {tourSteps.length}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6">
                <motion.p
                  key={`desc-${step.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-muted-foreground leading-relaxed"
                >
                  {step.description}
                </motion.p>

                {/* Progress Dots */}
                <div className="mt-6 flex justify-center gap-2">
                  {tourSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentStep 
                          ? 'w-6 bg-primary' 
                          : 'w-2 bg-muted hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Geri
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="text-muted-foreground"
                  >
                    Geç
                  </Button>

                  <Button onClick={handleNext} className="gap-1">
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
