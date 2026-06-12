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

const TOP_DREAMS_BY_CATEGORY: Record<string, string[]> = {
  hayvanlar: ['Yılan', 'Kedi', 'Köpek', 'At'],
  doga: ['Su', 'Yağmur', 'Ağaç', 'Güneş'],
  insanlar: ['Eski sevgili', 'Anne', 'Baba', 'Arkadaş'],
  nesneler: ['Anahtar', 'Ayna', 'Telefon', 'Para'],
  yiyecekler: ['Ekmek', 'Su', 'Meyve', 'Tatlı'],
};

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
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <Skeleton className="h-7 w-32 mb-3" />
              <Skeleton className="h-10 w-72 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-11 w-40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-20 md:py-28">
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

  const featured = categories[0];
  const featuredTheme = themeGradients[0];

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[480px] h-[480px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-fuchsia-500/10 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="container relative py-20 md:py-28">
        {/* Section header */}
        <div className="grid lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs sm:text-sm font-semibold mb-4"
            >
              <Compass className="h-3.5 w-3.5" />
              Kategoriler
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-[-0.025em] text-foreground leading-[1.05] mb-3"
            >
              Kategorilere Göre{' '}
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                Keşfedin
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="text-muted-foreground text-sm md:text-base max-w-xl"
            >
              8 ana kategoride binlerce rüya tabiri — ilginizi çeken konuya tıklayın, anlamları keşfedin.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-4 lg:flex lg:justify-end"
          >
            <Button
              variant="outline"
              size="lg"
              asChild
              className="self-start sm:self-auto group border-border hover:border-primary/30 hover:bg-primary/5 rounded-xl"
            >
              <Link to="/kategoriler">
                <Compass className="h-4 w-4 mr-2" />
                Tüm Kategoriler
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Bento grid */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Featured (large) card */}
          {featured && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="sm:col-span-2 lg:row-span-2"
            >
              <Link
                to={`/kategori/${featured.slug}`}
                className="group relative block h-full p-6 sm:p-7 rounded-3xl bg-card border border-border/50 overflow-hidden transition-all duration-500 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1"
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${featuredTheme.soft} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <div
                  className={`absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br ${featuredTheme.bg} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`}
                />

                <div className="relative h-full flex flex-col">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${featuredTheme.bg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                    >
                      <span className="text-3xl">{featured.icon || '📖'}</span>
                    </div>

                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground/60 mb-2">
                    <Sparkles className="h-3 w-3" />
                    Öne Çıkan Kategori
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors">
                    {featured.name}
                  </h3>

                  {featured.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-md">
                      {featured.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5 mt-auto">
                    <div>
                      <span className={`text-xl font-bold ${featuredTheme.text}`}>
                        {featured.dreamCount}
                      </span>{' '}
                      rüya tabiri
                    </div>
                    <span className="text-muted-foreground/40">·</span>
                    <div>
                      <span className="text-foreground font-semibold">{(TOP_DREAMS_BY_CATEGORY[featured.slug] || ['Rüya 1', 'Rüya 2', 'Rüya 3']).length}</span> popüler
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(TOP_DREAMS_BY_CATEGORY[featured.slug] || ['Rüya 1', 'Rüya 2', 'Rüya 3', 'Rüya 4']).map((dream) => (
                      <span
                        key={dream}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${featuredTheme.text} bg-card border ${featuredTheme.border}`}
                      >
                        {dream}
                      </span>
                    ))}
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${featuredTheme.bg} flex items-center justify-center shadow-lg`}
                    >
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Other 7 categories */}
          {categories.slice(1).map((category, index) => {
            const theme = themeGradients[(index + 1) % themeGradients.length];

            return (
              <motion.div
                key={category.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <Link
                  to={`/kategori/${category.slug}`}
                  className={`group relative block h-full p-5 rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1`}
                >
                  {/* Background gradient on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${theme.soft} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <div
                    className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${theme.bg} opacity-0 group-hover:opacity-10 blur-2xl transition-all duration-500 group-hover:scale-150`}
                  />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.bg} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                      >
                        <CategoryIcon icon={category.icon} className="text-xl" />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300">
                        <div
                          className={`w-7 h-7 rounded-full bg-gradient-to-br ${theme.bg} flex items-center justify-center shadow-md`}
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-foreground mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                      {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium">
                      <span className={`font-bold ${theme.text}`}>{category.dreamCount}</span>{' '}
                      rüya tabiri
                    </p>
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
