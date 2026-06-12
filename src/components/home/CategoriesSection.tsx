import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { supabase } from '@/integrations/supabase/client';

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  dreamCount: number;
}

const themeGradients = [
  'from-orange-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-fuchsia-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-yellow-500',
  'from-pink-500 to-rose-500',
  'from-indigo-500 to-blue-500',
  'from-red-500 to-orange-500',
];

export function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: categoriesData, error: catError } = await supabase
          .from('categories')
          .select('id, name, slug, icon')
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
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                icon: cat.icon,
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
      <section className="py-10 md:py-14 relative">
        <div className="container">
          <div className="flex items-end justify-between gap-4 mb-6">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-10 md:py-14">
        <div className="container">
          <div className="text-center py-12 bg-card border border-border/40 rounded-2xl max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-6 w-6 text-primary/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Henüz kategori eklenmemiş</h3>
            <p className="text-sm text-muted-foreground">Yakında kategoriler eklenecek.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 relative overflow-hidden">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-[11px] font-semibold mb-2"
            >
              <Compass className="h-3 w-3" />
              Kategoriler
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
            >
              Kategorilere Göre{' '}
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                Keşfedin
              </span>
            </motion.h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="self-start sm:self-auto group text-muted-foreground hover:text-foreground"
          >
            <Link to="/kategoriler">
              Tüm Kategoriler
              <ArrowRight className="ml-1.5 h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-30px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.04 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          {categories.map((category, index) => {
            const theme = themeGradients[index % themeGradients.length];
            return (
              <motion.div
                key={category.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
                }}
              >
                <Link
                  to={`/kategori/${category.slug}`}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div
                    className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${theme} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}
                  >
                    <CategoryIcon
                      icon={category.icon}
                      size="lg"
                      className="text-white"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {category.dreamCount} rüya
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
