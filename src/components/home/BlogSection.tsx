import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles, Clock, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types/blog';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function stripHtml(html: string) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories(id, name, slug, icon)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (postsError) {
        console.error('Error fetching blog posts:', postsError);
        setIsLoading(false);
        return;
      }

      if (!postsData || postsData.length === 0) {
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
    } catch (err) {
      console.error('Error in fetchPosts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoading && posts.length === 0) {
    return (
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container relative">
          <EmptyState
            icon="book"
            title="Henüz blog yazısı yok"
            description="Yeni yazılar çok yakında burada paylaşılacak."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-semibold mb-4"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Rüya Günlüğü
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground"
            >
              Rüya Günlüğünden{' '}
              <span className="text-gradient">Yazılar</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-muted-foreground mt-2 text-sm md:text-base max-w-lg"
            >
              Rüyalar, bilinçaltı ve psikoloji hakkında en güncel içerikler
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl border-border hover:border-primary/30 hover:bg-primary/5 group"
            >
              <Link to="/blog">
                <BookOpen className="w-4 h-4 mr-2" />
                Tüm Yazıları Gör
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-card/60 border border-border/40 rounded-2xl overflow-hidden shadow-sm"
              >
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
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
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {posts.map((post) => {
              const excerpt = stripHtml(post.content || '').slice(0, 160);
              return (
                <motion.article
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }}
                  className="group bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col"
                >
                  <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-pink-500/20">
                    {post.featured_image ? (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center ${post.featured_image ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/20' : ''}`}>
                      <BookOpen className="w-10 h-10 text-primary/40" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
                    {post.category && (
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm text-[11px] font-semibold text-foreground shadow-sm">
                          {post.category.name}
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.created_at)}
                      </span>
                      {post.read_time && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.read_time} dk
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-2">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {excerpt}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        {post.author?.avatar_url ? (
                          <img
                            src={post.author.avatar_url}
                            alt={post.author.full_name || ''}
                            loading="lazy"
                            decoding="async"
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-[10px] font-bold text-foreground">
                            {(post.author?.full_name || 'M').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-medium text-foreground truncate max-w-[140px]">
                          {post.author?.full_name || 'MysticLog Ekibi'}
                        </span>
                      </div>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                      >
                        Oku
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
