import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, ChevronRight, BookOpen } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/ui/page-transition';
import { blogApi, adminApi } from '@/lib/api';
import { BlogPost } from '@/types/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { TagCloud } from '@/components/blog/TagCloud';

export default function BlogTag() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = tag ? decodeURIComponent(tag) : '';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (decodedTag) {
      fetchPostsByTag();
    }
  }, [decodedTag]);

  const fetchPostsByTag = async () => {
    setIsLoading(true);

    const response = await blogApi.getPosts({ tag: decodedTag });

    if (!response.success || !response.data) {
      setPosts([]);
      setIsLoading(false);
      return;
    }

    const postsData = response.data;

    // Fetch author profiles
    const authorIds = [...new Set(postsData.map((p: BlogPost) => p.author_id).filter(Boolean))];
    const profilesResponse = await adminApi.getProfiles(authorIds);
    
    const profileMap = new Map(profilesResponse.success && profilesResponse.data 
      ? profilesResponse.data.map((p) => [p.user_id, p])
      : []);

    const enrichedPosts = postsData.map((post: BlogPost) => {
      const author = profileMap.get(post.author_id);
      return {
        ...post,
        category: post.category || undefined,
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
  };

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
          <section className="container pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
                <Tag className="w-4 h-4" />
                Etiket
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                #{decodedTag}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
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
                      <div
                        key={i}
                        className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse"
                      />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      Yazı bulunamadı
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Bu etiketle ilişkili yazı bulunmuyor.
                    </p>
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
