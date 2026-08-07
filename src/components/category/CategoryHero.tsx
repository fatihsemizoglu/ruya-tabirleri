import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import type { Category } from '@/types/database';

interface CategoryHeroProps {
  category: Category;
  featuredGradient: string;
}

export function CategoryHero({ category, featuredGradient }: CategoryHeroProps) {
  return (
    <section className="relative overflow-hidden pb-6">
      <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${featuredGradient}`} />
      <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${featuredGradient}`} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="container relative py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button variant="ghost" size="sm" asChild className="mb-6 rounded-xl">
            <Link to="/kategoriler">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tüm Kategoriler
            </Link>
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br ${featuredGradient} flex items-center justify-center shadow-2xl shadow-primary/20`}
          >
            <CategoryIcon icon={category.icon} className="text-5xl md:text-6xl" />
          </motion.div>

          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4"
            >
              <PremiumBadge>
                <Sparkles className="h-3.5 w-3.5" />
                {category.name} Rüya Tabirleri
              </PremiumBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif-dream font-bold leading-tight mb-4"
            >
              <span className={`bg-gradient-to-br ${featuredGradient} bg-clip-text text-transparent`}>
                {category.name}
              </span>
              {' '}<GradientText>Rüya Tabirleri</GradientText>
            </motion.h1>

            {category.description && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-muted-foreground max-w-2xl leading-relaxed"
              >
                {category.description}
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
