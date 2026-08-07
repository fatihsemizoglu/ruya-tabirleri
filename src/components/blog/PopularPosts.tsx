import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Heart, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface PopularPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  view_count: number;
  like_count: number;
  created_at: string;
  category: {
    name: string;
    slug: string;
    icon: string | null;
  } | null;
}

type SortType = 'views' | 'likes' | 'trending';

export function PopularPosts() {
  const [posts, setPosts] = useState<PopularPost[]>([]);
  const [sortBy, setSortBy] = useState<SortType>('trending');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPopularPosts = useCallback(async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        view_count,
        like_count,
        created_at,
        category:blog_categories(name, slug, icon)
      `)
      .eq('is_published', true);

    if (sortBy === 'views') {
      query = query.order('view_count', { ascending: false });
    } else if (sortBy === 'likes') {
      query = query.order('like_count', { ascending: false });
    } else {
      query = query.order('view_count', { ascending: false });
    }

    const { data } = await query.limit(5);

    if (data) {
      let sortedData = data as PopularPost[];
      
      if (sortBy === 'trending') {
        sortedData = sortedData.sort((a, b) => {
          const scoreA = (a.view_count || 0) + (a.like_count || 0) * 3;
          const scoreB = (b.view_count || 0) + (b.like_count || 0) * 3;
          return scoreB - scoreA;
        });
      }
      
      setPosts(sortedData);
    }
    
    setIsLoading(false);
  }, [sortBy]);

  useEffect(() => {
    fetchPopularPosts();
  }, [fetchPopularPosts]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Popüler Yazılar</h3>
      </div>

      <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortType)} className="mb-4">
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="trending" className="text-xs gap-1">
            🔥 Trend
          </TabsTrigger>
          <TabsTrigger value="views" className="text-xs gap-1">
            <Eye className="w-3 h-3" />
            Görüntüleme
          </TabsTrigger>
          <TabsTrigger value="likes" className="text-xs gap-1">
            <Heart className="w-3 h-3" />
            Beğeni
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-1">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/blog/${post.slug}`}
              className="flex min-h-11 items-start gap-3 p-2.5 -mx-2 rounded-xl hover:bg-muted/50 transition-all duration-200 group"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center text-xs font-bold border border-primary/10">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  {post.title}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {post.view_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {post.like_count || 0}
                  </span>
                  {post.category && (
                    <span className="text-primary/70 truncate">
                      {post.category.icon || '📖'} {post.category.name}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-primary group-hover:translate-x-0.5 transition-all self-center" />
            </Link>
          </motion.div>
        ))}
      </div>

      <Link
        to="/blog"
        className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium mt-4 pt-4 border-t border-border transition-colors"
      >
        Tüm yazıları gör
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
