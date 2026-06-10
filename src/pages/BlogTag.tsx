import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, ChevronRight, BookOpen } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { PageTransition } from '@/components/ui/page-transition';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { TagCloud } from '@/components/blog/TagCloud';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function BlogTag() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = tag ? decodeURIComponent(tag) : '';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPostsByTag = useCallback(async () => {
    setIsLoading(true);

    const { data: postsData } = await supabase
      .from('blog_posts')
      .select(`
        *,
        category:blog_categories(id, name, slug, icon)
      `)
      .eq('is_published', true)
      .contains('tags', [decodedTag])
      .order('created_at', { ascending: false });

    if (!postsData) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    // Fetch author profiles
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
  }, [decodedTag]);

  useEffect(() => {
    if (decodedTag) {
      fetchPostsByTag();
    }
  }, [decodedTag, fetchPostsByTag]);

  return (
    <Layout>
      <PageTransition>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          {/* Breadcrumb */}
          <div className="container py-6">
            <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Link to="/" className="hover:text-indigo-600 transition-colors">
                Ana Sayfa
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/blog" className="hover:text-indigo-600 transition-colors">
                Blog
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-slate-900 dark:text-white font-medium">
                #{decodedTag}
              </span>
            </nav>
          </div>

          {/* Header */}
          <section className="container pb-12 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="mb-6">
                <PremiumBadge>
                  <Tag className="h-3.5 w-3.5" />
                  Etiket
                </PremiumBadge>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] text-foreground mb-4">
                <GradientText>#{decodedTag}</GradientText>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Bu etiketle ilgili {posts.length} yazı bulundu
              </p>
            </motion.div>
          </section>

          {/* Content */}
          <section className="container pb-16">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Posts */}
              <div className="lg:col-span-3">
                {isLoading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                        <Skeleton className="h-44 w-full rounded-none" />
                        <div className="p-5 space-y-3">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-6 w-4/5" />
                          <Skeleton className="h-6 w-3/4" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-full" />
                            <Skeleton className="h-3.5 w-5/6" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-card border border-border/40 rounded-2xl">
                    <EmptyState
                      icon="book"
                      title="Yazı bulunamadı"
                      description="Bu etiketle ilişkili yazı bulunmuyor."
                    />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {posts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <BlogCard post={post} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="sticky top-24 space-y-8">
                  <TagCloud />
                </div>
              </aside>
            </div>
          </section>
        </div>
      </PageTransition>
    </Layout>
  );
}
