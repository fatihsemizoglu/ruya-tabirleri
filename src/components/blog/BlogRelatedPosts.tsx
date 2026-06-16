import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';

interface BlogSummary {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  content: string;
  category?: { name: string; slug: string } | null;
}

interface BlogRelatedPostsProps {
  posts: BlogSummary[];
  calculateReadingTime?: (content: string) => number;
  categoryColor?: string;
}

export function BlogRelatedPosts({ posts, calculateReadingTime, categoryColor }: BlogRelatedPostsProps) {
  if (!posts || posts.length === 0) return null;

  const gradient = categoryColor || 'from-violet-500 to-purple-500';
  const readTime = (content: string) => {
    if (calculateReadingTime) return calculateReadingTime(content);
    const words = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <Card className="bg-white/90 backdrop-blur-xl shadow-xl border-0 overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${gradient}`} />
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`p-2 bg-gradient-to-br ${gradient} rounded-xl`}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            İlgili Yazılar
          </CardTitle>
          <CardDescription>Benzer konularda diğer blog yazıları</CardDescription>
        </CardHeader>
        <CardContent className="p-4 grid gap-4 sm:grid-cols-2">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/blog/${post.slug}`}
                className="group cursor-pointer block h-full"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex flex-col h-full p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all duration-300"
                >
                  <div className="relative w-full h-32 rounded-lg overflow-hidden shadow-md mb-3 bg-slate-100">
                    {post.featured_image ? (
                      <ResponsiveImage
                        src={post.featured_image}
                        alt={post.title}
                        fallbackWidth={480}
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                        <BookOpen className="h-8 w-8 text-white/80" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 group-hover:text-violet-600 transition-colors leading-snug">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-2 text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{readTime(post.content)} dk okuma</span>
                    <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
