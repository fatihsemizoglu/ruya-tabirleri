import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blogApi } from '@/lib/api';
import { BlogPost } from '@/types/blog';
import { BlogCard } from '@/components/blog/BlogCard';

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const response = await blogApi.getAll({
      is_published: true,
      limit: 5,
      order_by: 'created_at',
      order_direction: 'desc'
    });

    if (!response.success || !response.data || response.data.length === 0) {
      setIsLoading(false);
      return;
    }

    const postsData = response.data;

    const enrichedPosts = postsData.map((post: BlogPost) => ({
      ...post,
      category: post.category,
      author: post.author,
    }));

    const featured = enrichedPosts.find((p: BlogPost) => p.is_featured);
    if (featured) {
      setFeaturedPost(featured);
      setPosts(enrichedPosts.filter((p: BlogPost) => p.id !== featured.id).slice(0, 3));
    } else {
      setPosts(enrichedPosts.slice(0, 4));
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-950" />
        <div className="container relative">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-[400px] bg-slate-200 dark:bg-slate-700 rounded-3xl" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredPost && posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-white dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-950" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
      
      <div className="container relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Blog
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Rüya Dünyasından{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Yazılar
              </span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-lg">
              Rüyalar, bilinçaltı ve psikoloji hakkında en güncel içerikler
            </p>
          </div>
          <Button asChild variant="outline" className="hidden sm:flex gap-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
            <Link to="/blog">
              Tümünü Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Featured Post */}
          {featuredPost && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:row-span-2"
            >
              <BlogCard post={featuredPost} variant="featured" />
            </motion.div>
          )}

          {/* Recent Posts */}
          <div className="space-y-4">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <BlogCard post={post} variant="compact" />
              </motion.div>
            ))}
            
            {/* View All Card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: posts.length * 0.1, duration: 0.5 }}
            >
              <Link 
                to="/blog"
                className="group flex items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/50 dark:bg-slate-800/30 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-all duration-300"
              >
                <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Tüm Yazıları Keşfet
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Mobile CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center sm:hidden"
        >
          <Button asChild className="gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Link to="/blog">
              Tüm Yazıları Gör
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
