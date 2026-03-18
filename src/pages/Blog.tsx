import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Grid3X3, List, Search } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { blogApi } from '@/lib/api';
import { BlogPost, BlogCategory } from '@/types/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { TagCloud } from '@/components/blog/TagCloud';
import { PopularPosts } from '@/components/blog/PopularPosts';

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const categoriesRef = useRef<BlogCategory[]>([]);
  // categoriesRef is used to access current categories without triggering effect re-runs
  categoriesRef.current = categories;

  const selectedCategory = searchParams.get('kategori');

  const fetchCategories = async () => {
    const response = await blogApi.getCategories();

    if (response.success && response.data) {
      const categoriesData = response.data as BlogCategory[];
      setCategories(categoriesData);
      categoriesRef.current = categoriesData;
    }
  };

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);

    const params: { category_id?: string } = {};
    
    if (selectedCategory) {
      const category = categoriesRef.current.find((c) => c.slug === selectedCategory);
      if (category) {
        params.category_id = category.id;
      }
    }

    const response = await blogApi.getPosts(params);

    if (!response.success || !response.data) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    const postsData = response.data.map((post) => ({
      ...post,
      category: post.category_id ? {
        id: post.category_id,
        name: post.category_name || '',
        slug: selectedCategory || '',
        description: null,
        icon: null,
        order_index: null,
        created_at: '',
        updated_at: '',
      } : undefined,
      author: post.author_name ? {
        id: post.author_id,
        full_name: post.author_name,
        username: post.author_name,
        avatar_url: post.author_avatar || null,
      } : undefined,
    }));

    setPosts(postsData);
    setIsLoading(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryClick = (slug: string | null) => {
    if (slug) {
      setSearchParams({ kategori: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          {/* Hero Section */}
          <section className="relative py-20 md:py-28 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
            
            <div className="container relative">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center max-w-3xl mx-auto"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-8 shadow-lg shadow-indigo-500/10"
                >
                  <BookOpen className="w-4 h-4" />
                  Rüya Blogu
                </motion.div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                  Rüya Dünyasını{' '}
                  <span className="relative">
                    <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Keşfedin
                    </span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                      <path d="M2 10C50 4 150 4 198 10" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                          <stop stopColor="#6366f1"/>
                          <stop offset="0.5" stopColor="#a855f7"/>
                          <stop offset="1" stopColor="#ec4899"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Rüyalar, bilinçaltı, psikoloji ve daha fazlası hakkında derinlemesine yazılar
                </p>
              </motion.div>
            </div>
          </section>

          {/* Filters & Content */}
          <section className="pb-20">
            <div className="container">
              {/* Categories - Enhanced with glass effect */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-wrap gap-2 mb-8 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50"
              >
                <Button
                  variant={!selectedCategory ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryClick(null)}
                  className={`rounded-full transition-all duration-300 ${
                    !selectedCategory 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25' 
                      : 'hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  Tümü
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryClick(category.slug)}
                    className={`rounded-full transition-all duration-300 ${
                      selectedCategory === category.slug 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25' 
                        : 'hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    {category.icon} {category.name}
                  </Button>
                ))}
              </motion.div>

              {/* Search & View Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-4 mb-10 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Yazılarda ara..."
                    className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 bg-white dark:bg-slate-800/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={`h-12 w-12 rounded-xl ${
                      viewMode === 'grid' 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={`h-12 w-12 rounded-xl ${
                      viewMode === 'list' 
                        ? 'bg-indigo-600 hover:bg-indigo-700' 
                        : 'hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </Button>
                </div>
              </motion.div>

              {/* Posts Grid with Sidebar */}
              <div className="grid lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  {isLoading ? (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="h-80 bg-slate-200 dark:bg-slate-700 rounded-3xl animate-pulse"
                        />
                      ))}
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-20 bg-white/50 dark:bg-slate-800/30 rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    >
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Henüz yazı bulunamadı
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        {searchQuery
                          ? 'Arama kriterlerinize uygun yazı bulunamadı. Farklı anahtar kelimeler deneyin.'
                          : 'Bu kategoride henüz yazı yayınlanmamış.'}
                      </p>
                    </motion.div>
                  ) : (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                      {filteredPosts.map((post, index) => (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <BlogCard post={post} variant={viewMode === 'list' ? 'compact' : 'default'} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-1">
                  <div className="sticky top-24 space-y-6">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-indigo-500/5"
                    >
                      <PopularPosts />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg shadow-indigo-500/5"
                    >
                      <TagCloud />
                    </motion.div>
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </div>
      </PageTransition>
    </Layout>
  );
}
