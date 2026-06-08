// @ts-nocheck
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Star, Moon, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';

interface PopularDream {
  id: string;
  title: string;
  slug: string;
  view_count: number;
  like_count: number;
  category: string;
  is_featured: boolean;
  gradient: string;
}

const gradients = [
  'from-violet-500 to-fuchsia-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
];

export function FeaturedDreams() {
  const [dreams, setDreams] = useState<PopularDream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopularDreams() {
      try {
        const { data, error } = await supabase
          .from('dreams')
          .select(`
            id,
            title,
            slug,
            view_count,
            like_count,
            is_featured,
            categories:category_id (name)
          `)
          .eq('is_published', true)
          .order('is_featured', { ascending: false })
          .order('view_count', { ascending: false })
          .limit(15);

        if (error) throw error;

        if (data) {
          const mapped = data.map((d: any, index: number) => ({
            id: d.id,
            title: d.title,
            slug: d.slug,
            view_count: d.view_count || 0,
            like_count: d.like_count || 0,
            category: (d.categories)?.name || 'Genel',
            is_featured: d.is_featured,
            gradient: gradients[index % gradients.length],
          }));
          setDreams(mapped);
        }
      } catch (err) {
        console.error('Error fetching popular dreams:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPopularDreams();
  }, []);

  return (
    <section className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-semibold mb-4"
            >
              <Flame className="h-3.5 w-3.5" />
              En Çok Arananlar
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground"
            >
              Popüler Rüya Tabirleri
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-muted-foreground mt-2 text-sm md:text-base"
            >
              En çok okunan ve sevilen tabirler
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button variant="outline" size="lg" asChild className="self-start sm:self-auto group border-border hover:border-primary/30 hover:bg-primary/5 rounded-xl">
              <Link to="/populer">
                Tümünü Gör
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 bg-card/60 border border-border/40 rounded-xl"
              >
                <Skeleton className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3.5 w-3.5 rounded" />
              </div>
            ))}
          </div>
        ) : dreams.length === 0 ? (
          <EmptyState
            icon="moon"
            title="Henüz rüya tabiri bulunmuyor"
            description="Yayınlanmış rüya tabirleri burada listelenecek. Çok yakında harika içeriklerle dolacak."
            variant="default"
            className="bg-card/60 border border-border/40 rounded-2xl max-w-xl mx-auto"
          />
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.03 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            {dreams.map((dream, index) => (
              <motion.div
                key={dream.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <Link
                  to={`/ruya/${dream.slug}`}
                  className="group flex items-center gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 bg-card/70 border border-border/50 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                >
                  <span
                    className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br ${dream.gradient} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-sm`}
                  >
                    {index + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                        {dream.title}
                      </h3>
                      {dream.is_featured && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                      <span className="truncate">{dream.category}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {dream.view_count.toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
