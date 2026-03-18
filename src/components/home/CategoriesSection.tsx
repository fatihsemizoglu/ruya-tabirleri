import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Cat, Cloud, Users, Heart, Briefcase, Home, Utensils, Car, Sparkles, Moon, Star, Leaf, Music, Book, Gem, Eye, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { categoriesApi, dreamsApi } from '@/lib/api';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  cat: Cat,
  cloud: Cloud,
  users: Users,
  heart: Heart,
  briefcase: Briefcase,
  home: Home,
  utensils: Utensils,
  car: Car,
  sparkles: Sparkles,
  moon: Moon,
  star: Star,
  leaf: Leaf,
  music: Music,
  book: Book,
  gem: Gem,
  eye: Eye,
  zap: Zap,
};

const gradientStyles = [
  { bg: 'from-orange-500 to-amber-500', light: 'bg-orange-50 dark:bg-orange-950/30' },
  { bg: 'from-sky-500 to-blue-500', light: 'bg-sky-50 dark:bg-sky-950/30' },
  { bg: 'from-violet-500 to-purple-500', light: 'bg-violet-50 dark:bg-violet-950/30' },
  { bg: 'from-rose-500 to-pink-500', light: 'bg-rose-50 dark:bg-rose-950/30' },
  { bg: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { bg: 'from-amber-500 to-yellow-500', light: 'bg-amber-50 dark:bg-amber-950/30' },
  { bg: 'from-red-500 to-orange-500', light: 'bg-red-50 dark:bg-red-950/30' },
  { bg: 'from-indigo-500 to-blue-500', light: 'bg-indigo-50 dark:bg-indigo-950/30' },
];

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  dreamCount: number;
}

export function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await categoriesApi.getAll();

        if (!response.success) throw new Error('Failed to fetch categories');

        if (response.data) {
          // Filter parent categories only and take first 8
          const parentCategories = response.data
            .filter(cat => cat.parent_id === null)
            .slice(0, 8)
            .map(cat => ({
              ...cat,
              dreamCount: cat.dream_count || 0
            }));

          setCategories(parentCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const getIcon = (iconName: string | null, index: number) => {
    if (iconName && iconMap[iconName.toLowerCase()]) {
      return iconMap[iconName.toLowerCase()];
    }
    const defaultIcons = [Cat, Cloud, Users, Heart, Briefcase, Home, Utensils, Car];
    return defaultIcons[index % defaultIcons.length];
  };

  const getGradient = (index: number) => {
    return gradientStyles[index % gradientStyles.length];
  };

  if (loading) {
    return (
      <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <Skeleton className="h-12 w-48 mb-2" />
              <Skeleton className="h-6 w-72" />
            </div>
            <Skeleton className="h-12 w-40" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Henüz kategori eklenmemiş</h3>
            <p className="text-slate-500 dark:text-slate-400">Yakında kategoriler eklenecek.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 bg-slate-50 dark:bg-slate-900">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3">
              Kategoriler
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400">
              Rüya tabirlerini kategorilere göre keşfedin
            </p>
          </div>
          <Button variant="outline" size="lg" asChild className="self-start sm:self-auto group">
            <Link to="/kategoriler">
              Tüm Kategoriler
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const IconComponent = getIcon(category.icon, index);
            const gradient = getGradient(index);

            return (
              <Link
                key={category.id}
                to={`/kategori/${category.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 transition-all duration-500 hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 ${gradient.light} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative">
                  {/* Icon with Gradient */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient.bg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {category.name}
                  </h3>

                  {/* Count */}
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {category.dreamCount} rüya tabiri
                  </p>
                </div>

                {/* Arrow */}
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
