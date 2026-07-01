import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { supabase } from '@/integrations/supabase/client';

const themeGradients = [
  { bg: 'from-orange-500 to-rose-500', soft: 'from-orange-500/15 to-rose-500/5', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20' },
  { bg: 'from-blue-500 to-cyan-500', soft: 'from-blue-500/15 to-cyan-500/5', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
  { bg: 'from-violet-500 to-fuchsia-500', soft: 'from-violet-500/15 to-fuchsia-500/5', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/20' },
  { bg: 'from-emerald-500 to-teal-500', soft: 'from-emerald-500/15 to-teal-500/5', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
  { bg: 'from-amber-500 to-yellow-500', soft: 'from-amber-500/15 to-yellow-500/5', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
  { bg: 'from-pink-500 to-rose-500', soft: 'from-pink-500/15 to-rose-500/5', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/20' },
  { bg: 'from-indigo-500 to-blue-500', soft: 'from-indigo-500/15 to-blue-500/5', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
  { bg: 'from-red-500 to-orange-500', soft: 'from-red-500/15 to-orange-500/5', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
];

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  dreamCount: number;
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('id, name, slug, icon, description')
          .is('parent_id', null)
          .order('order_index', { ascending: true })
          .limit(8);

        if (catError) throw catError;

        if (categoriesData) {
          const categoriesWithCounts = await Promise.all(
            categoriesData.map(async (cat) => {
              const { count } = await supabase
                .from('dreams')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', cat.id)
                .eq('is_published', true);

              return {
                ...cat,
                description: cat.description ?? null,
                dreamCount: count || 0,
              };
            })
          );

          setCategories(categoriesWithCounts);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-14 md:py-20 relative overflow-hidden">
        <div className="container relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-7 w-32 mb-3" />
              <Skeleton className="h-10 w-72 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-11 w-40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-14 md:py-20">
        <div className="container">
          <div className="text-center py-16 bg-card border border-border/40 rounded-3xl max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Henüz kategori eklenmemiş</h3>
            <p className="text-muted-foreground">Yakında kategoriler eklenecek.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[480px] h-[480px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-fuchsia-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="container relative py-14 md:py-20">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold mb-3"
            >
              <Compass className="h-3 w-3" />
              Kategoriler
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-[-0.025em] text-foreground leading-[1.05]"
            >
              Kategorilere Göre{' '}
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                Keşfedin
              </span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              variant="outline"
              size="sm"
              asChild
              className="group border-border hover:border-primary/30 hover:bg-primary/5 rounded-xl"
            >
              <Link to="/kategoriler">
                <Compass className="h-3.5 w-3.5 mr-1.5" />
                Tüm Kategoriler
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Compact grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {categories.map((category, index) => {
            const theme = themeGradients[index % themeGradients.length] ?? themeGradients[0]!;

            return (
              <motion.div
                key={category.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
              >
                <Link
                  to={`/kategori/${category.slug}`}
                  className="group relative flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border/50 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5"
                >
                  {/* Background gradient on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${theme.soft} opacity-0 group-hover:opacity-100 transition-opacity duration-400`}
                  />

                  <div className="relative flex items-center gap-3 w-full min-w-0">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${theme.bg} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                    >
                      <CategoryIcon icon={category.icon} className="text-lg" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        {category.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        <span className={`font-bold ${theme.text}`}>{category.dreamCount}</span>{' '}
                        rüya
                      </p>
                    </div>

                    <ArrowRight className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
