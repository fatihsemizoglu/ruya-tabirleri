import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles, Clock, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
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
        .limit(9);

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
      <section className="py-10 md:py-14 relative overflow-hidden">
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
    <section className="py-10 md:py-14 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mb-6"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary text-[11px] font-semibold mb-2"
            >
              <Sparkles className="w-3 h-3" />
              Rüya Günlüğü
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="text-2xl md:text-3xl font-bold tracking-tight text-foreground"
            >
              Rüya Günlüğünden{' '}
              <span className="text-gradient">Yazılar</span>
            </motion.h2>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="group text-muted-foreground hover:text-foreground"
          >
            <Link to="/blog">
              Tüm Yazıları Gör
              <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </motion.div>

        <div className="relative px-10 sm:px-12">
          {isLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-0 shrink-0 grow-0 basis-full md:basis-1/2 lg:basis-1/3 pl-4"
                >
                  <div className="bg-card/60 border border-border/40 rounded-xl overflow-hidden shadow-sm">
                    <Skeleton className="h-32 w-full rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Carousel
              opts={{
                align: 'start',
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {posts.map((post) => {
                  const excerpt = stripHtml(post.content || '').slice(0, 140);
                  return (
                    <CarouselItem
                      key={post.id}
                      className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                    >
                      <motion.article
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35 }}
                        className="group h-full bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col"
                      >
                        <Link
                          to={`/blog/${post.slug}`}
                          className="block relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-violet-500/20 via-fuchsia-500/15 to-pink-500/20"
                        >
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
                          <div
                            className={`absolute inset-0 flex items-center justify-center ${post.featured_image ? 'opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-black/20' : ''}`}
                          >
                            <BookOpen className="w-8 h-8 text-primary/40" />
                          </div>
                          {post.category && (
                            <div className="absolute top-2 left-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm text-[10px] font-semibold text-foreground shadow-sm">
                                {post.category.name}
                              </span>
                            </div>
                          )}
                        </Link>

                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {formatDate(post.created_at)}
                            </span>
                            {post.read_time && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  {post.read_time} dk
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {excerpt}
                          </p>

                          <div className="mt-auto flex items-center justify-between pt-2 border-t border-border/40">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {post.author?.avatar_url ? (
                                <img
                                  src={post.author.avatar_url}
                                  alt={post.author.full_name || ''}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-border"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-[9px] font-bold text-foreground">
                                  {(post.author?.full_name || 'M').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <span className="text-[11px] font-medium text-foreground truncate max-w-[100px]">
                                {post.author?.full_name || 'Rüya Ekibi'}
                              </span>
                            </div>
                            <Link
                              to={`/blog/${post.slug}`}
                              className="text-[11px] font-semibold text-primary inline-flex items-center gap-1 hover:gap-1.5 transition-all"
                            >
                              Oku
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </motion.article>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex -left-2 lg:-left-4 h-9 w-9 border-border bg-background/80 backdrop-blur" />
              <CarouselNext className="hidden sm:flex -right-2 lg:-right-4 h-9 w-9 border-border bg-background/80 backdrop-blur" />
            </Carousel>
          )}
        </div>
      </div>
    </section>
  );
}
