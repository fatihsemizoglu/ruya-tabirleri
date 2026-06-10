import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Grid3X3, List, Search, Sparkles, ArrowRight, FileText, X, Filter, Clock } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost, BlogCategory } from '@/types/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { TagCloud } from '@/components/blog/TagCloud';
import { PopularPosts } from '@/components/blog/PopularPosts';

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year';

const timeFilterLabels: Record<TimeFilter, string> = {
  all: 'Tüm Zamanlar',
  today: 'Bugün',
  week: 'Bu Hafta',
  month: 'Bu Ay',
  year: 'Bu Yıl',
};

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const selectedCategory = searchParams.get('kategori');

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (data) {
      setCategories(data as BlogCategory[]);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(id, name, slug, icon)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (selectedCategory) {
      const category = categories.find((c) => c.slug === selectedCategory);
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    const { data: postsData } = await query;

    if (!postsData) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    const authorIds = [...new Set(postsData.map((p) => p.author_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, username, avatar_url')
      .in('user_id', authorIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

    const enrichedPosts = postsData.map((post) => {
      const author = profileMap.get(post.author_id);
      return {
        ...post,
        category: post.category as BlogPost['category'],
        author: author ? {
          id: author.user_id,
          full_name: author.full_name,
          username: author.username,
          avatar_url: author.avatar_url,
        } : undefined,
      } as BlogPost;
    });

    setPosts(enrichedPosts);
    setIsLoading(false);
  }, [selectedCategory, categories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    const now = new Date();
    let timeFilterDate: string | null = null;
    switch (timeFilter) {
      case 'today': timeFilterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(); break;
      case 'week': timeFilterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); break;
      case 'month': timeFilterDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); break;
      case 'year': timeFilterDate = new Date(now.getFullYear(), 0, 1).toISOString(); break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.excerpt?.toLowerCase().includes(q) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (timeFilterDate) {
      result = result.filter((post) => new Date(post.created_at) >= new Date(timeFilterDate!));
    }

    return result;
  }, [posts, searchQuery, timeFilter]);

  const handleCategoryClick = (slug: string | null) => {
    if (slug) {
      setSearchParams({ kategori: slug });
    } else {
      setSearchParams({});
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setTimeFilter('all');
    handleCategoryClick(null);
  };

  const activeCategory = categories.find(c => c.slug === selectedCategory);
  const featuredPost = filteredPosts[0];
  const remainingPosts = filteredPosts.slice(1);

  return (
    <Layout>
      <div className="min-h-screen bg-mesh relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />

        {/* Hero Section */}
        <section className="relative pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
              >
                <BookOpen className="w-4 h-4" />
                Rüya Dünyası Blog
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="text-5xl md:text-6xl lg:text-7xl font-serif-dream font-bold leading-[1.05] mb-6 tracking-tight"
              >
                Rüyaların{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                    Gizemli
                  </span>
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.6, duration: 1 }}
                    className="absolute -bottom-2 left-0 w-full h-3"
                    viewBox="0 0 200 12"
                    fill="none"
                  >
                    <path
                      d="M2 10C50 4 150 4 198 10"
                      stroke="url(#blog-underline-gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="blog-underline-gradient" x1="0" y1="0" x2="200" y2="0">
                        <stop stopColor="#8b5cf6" />
                        <stop offset="0.5" stopColor="#d946ef" />
                        <stop offset="1" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </motion.svg>
                </span>
                {' '}Dünyası
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                Rüyalar, bilinçaltı, psikoloji ve rüya tabirleri üzerine derinlemesine yazılar, rehberler ve uzman görüşleri.
              </motion.p>

              {/* Quick stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <strong className="text-foreground font-semibold">{posts.length}</strong> yazı
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <strong className="text-foreground font-semibold">{categories.length}</strong> kategori
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Her hafta yeni içerik
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Sticky Filter Bar */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 mb-6 shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Yazılarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger className="w-[150px] h-10 rounded-xl bg-muted/30 border-border/50">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(timeFilterLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory || 'all'} onValueChange={(v) => handleCategoryClick(v === 'all' ? null : v)}>
                <SelectTrigger className="w-[170px] h-10 rounded-xl bg-muted/30 border-border/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.slug}>
                      {category.icon || '📖'} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center border border-border/50 rounded-xl overflow-hidden bg-muted/30">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-10 w-10 rounded-none ${
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={`h-10 w-10 rounded-none ${
                    viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || timeFilter !== 'all' || selectedCategory) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap"
          >
            <span>Filtreler:</span>
            {timeFilter !== 'all' && (
              <Badge variant="secondary" className="rounded-full">
                {timeFilterLabels[timeFilter]}
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="rounded-full">
                {activeCategory?.name}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="rounded-full">
                "{searchQuery}"
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Temizle
            </Button>
          </motion.div>
        )}

        {/* Featured Post + Grid */}
        <section className="container py-12">
          {activeCategory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex items-center gap-3"
            >
              <span className="text-2xl">{activeCategory.icon || '📖'}</span>
              <div>
                <h2 className="text-2xl font-serif-dream font-bold">{activeCategory.name}</h2>
                <p className="text-sm text-muted-foreground">{filteredPosts.length} yazı</p>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {isLoading ? (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                      <Skeleton className="h-44 w-full rounded-none" />
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-3.5 w-16" />
                        </div>
                        <Skeleton className="h-6 w-4/5" />
                        <Skeleton className="h-6 w-3/4" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3.5 w-5/6" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-5 pt-3 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-7 w-7 rounded-full" />
                          <Skeleton className="h-3.5 w-20" />
                        </div>
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="surface rounded-3xl">
                  <EmptyState
                    icon={searchQuery ? 'search' : 'book'}
                    title="Henüz yazı bulunamadı"
                    description={
                      searchQuery
                        ? 'Arama kriterlerinize uygun yazı bulunamadı. Farklı anahtar kelimeler deneyin.'
                        : 'Bu kategoride henüz yazı yayınlanmamış.'
                    }
                    action={(searchQuery || selectedCategory) ? {
                      label: 'Filtreleri Temizle',
                      onClick: () => {
                        setSearchQuery('');
                        handleCategoryClick(null);
                      }
                    } : undefined}
                  />
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.05 } },
                  }}
                  className="space-y-8"
                >
                  {/* Featured (first) post */}
                  {!activeCategory && !searchQuery && featuredPost && (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      <BlogCard post={featuredPost} variant="featured" />
                    </motion.div>
                  )}

                  {/* Post grid/list */}
                  <div className={`grid gap-6 ${viewMode === 'grid' && (activeCategory || searchQuery) ? 'md:grid-cols-2' : viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {(activeCategory || searchQuery ? filteredPosts : remainingPosts).map((post) => (
                      <motion.div
                        key={post.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                      >
                        <BlogCard post={post} variant={viewMode === 'list' ? 'compact' : 'default'} />
                      </motion.div>
                    ))}
                  </div>

                  {/* View All Link */}
                  {!activeCategory && !searchQuery && posts.length > 1 && (
                    <div className="text-center pt-4">
                      <Button asChild variant="outline" size="lg" className="rounded-xl">
                        <Link to="/blog">
                          Tüm Yazıları Gör
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <PopularPosts />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <TagCloud />
                </motion.div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </Layout>
  );
}
