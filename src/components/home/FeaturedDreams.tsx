import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, Heart, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TiltCard } from '@/components/ui/tilt-card';
import { dreamsApi, categoriesApi, type Dream, type Category } from '@/lib/api';

const gradientStyles = [
  'from-orange-500 to-amber-500',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-emerald-500 to-teal-500',
  'from-red-500 to-orange-500',
  'from-indigo-500 to-blue-500',
  'from-amber-500 to-yellow-500',
];

export function FeaturedDreams() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedDreams() {
      try {
        // Fetch dreams and categories in parallel
        const [dreamsResponse, categoriesResponse] = await Promise.all([
          dreamsApi.getAll({ limit: 8 }),
          categoriesApi.getAll()
        ]);

        if (dreamsResponse.success && dreamsResponse.data) {
          setDreams(dreamsResponse.data);
        }

        if (categoriesResponse.success && categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching featured dreams:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedDreams();
  }, []);

  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Genel';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Genel';
  };

  const getGradient = (index: number): string => {
    return gradientStyles[index % gradientStyles.length];
  };

  if (loading) {
    return (
      <section className="py-20 md:py-28 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <Skeleton className="h-10 w-48 mb-4" />
              <Skeleton className="h-14 w-80" />
            </div>
            <Skeleton className="h-12 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (dreams.length === 0) {
    return (
      <section className="py-20 md:py-28 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4"
              >
                <Sparkles className="h-4 w-4" />
                <span>Öne Çıkanlar</span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white"
              >
                Popüler Rüya Tabirleri
              </motion.h2>
            </div>
          </div>
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Henüz rüya tabiri eklenmemiş</h3>
            <p className="text-slate-500 dark:text-slate-400">Yakında rüya tabirleri eklenecek.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-white dark:bg-slate-950">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4"
            >
              <Sparkles className="h-4 w-4" />
              <span>Öne Çıkanlar</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white"
            >
              Popüler Rüya Tabirleri
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button variant="outline" size="lg" asChild className="self-start sm:self-auto group">
              <Link to="/populer">
                Tümünü Gör
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Featured Grid - Modern Cards with 3D Tilt */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dreams.slice(0, 4).map((dream, index) => (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <TiltCard tiltAmount={4} className="h-full">
                <Link
                  to={`/ruya/${dream.slug}`}
                  className="group relative block h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 transition-all duration-500 glow-card"
                >
                  {/* Top Gradient Bar with Glow */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${getGradient(index)} group-hover:h-2 transition-all duration-300`} />
                  
                  <div className="p-6">
                    {/* Category & Featured Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {getCategoryName(dream.category_id)}
                      </span>
                      {dream.is_featured && (
                        <motion.div 
                          className="flex items-center gap-1 text-amber-500"
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </motion.div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {dream.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-5 leading-relaxed">
                      {dream.content?.substring(0, 150)}...
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-slate-400 dark:text-slate-500">
                      <div className="flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 group-hover:text-pink-500 transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="font-medium">{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>

                    {/* Hover Arrow with Glow */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <motion.div 
                        className={`w-10 h-10 rounded-full bg-gradient-to-r ${getGradient(index)} flex items-center justify-center shadow-lg`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ArrowRight className="h-5 w-5 text-white" />
                      </motion.div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
