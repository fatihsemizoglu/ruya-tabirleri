import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Eye, Heart, Clock, Tag, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BlogPost } from '@/types/blog';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface BlogCardProps {
  post: BlogPost;
  variant?: 'default' | 'featured' | 'compact';
}

export function BlogCard({ post, variant = 'default' }: BlogCardProps) {
  const formattedDate = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: tr,
  });

  if (variant === 'compact') {
    return (
      <motion.article
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: 4 }}
        className="group relative flex gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
      >
        {post.featured_image && (
          <Link to={`/blog/${post.slug}`} className="shrink-0">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden">
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        )}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <Link to={`/blog/${post.slug}`} className="group/link">
            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
              {post.title}
            </h3>
          </Link>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {post.view_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {post.like_count}
            </span>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity self-center" />
      </motion.article>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.article
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="relative group h-full min-h-[400px] overflow-hidden rounded-3xl"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
          )}
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-4 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative h-full p-6 md:p-8 flex flex-col justify-end">
          <div className="flex items-center gap-2 mb-4">
            {post.is_featured && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg shadow-orange-500/25">
                ✨ Öne Çıkan
              </Badge>
            )}
            {post.category && (
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-0">
                {post.category.icon} {post.category.name}
              </Badge>
            )}
          </div>
          
          <Link to={`/blog/${post.slug}`} className="group/link">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 group-hover/link:text-indigo-300 transition-colors leading-tight">
              {post.title}
            </h2>
          </Link>
          
          {post.excerpt && (
            <p className="text-white/80 line-clamp-2 mb-6 text-lg">{post.excerpt}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.author?.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.full_name || 'Yazar'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold ring-2 ring-white/30">
                  {(post.author?.full_name || post.author?.username || 'U').charAt(0)}
                </div>
              )}
              <div>
                <p className="text-white font-medium">
                  {post.author?.full_name || post.author?.username || 'Anonim'}
                </p>
                <p className="text-white/60 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formattedDate}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-white/70">
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Eye className="w-4 h-4" />
                {post.view_count}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Heart className="w-4 h-4" />
                {post.like_count}
              </span>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  // Default variant
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      className="group relative bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
    >
      {/* Featured Image */}
      {post.featured_image && (
        <Link to={`/blog/${post.slug}`} className="block relative overflow-hidden">
          <div className="aspect-[16/10] overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Floating Badge */}
          {post.is_featured && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg">
                ✨ Öne Çıkan
              </Badge>
            </div>
          )}
        </Link>
      )}
      
      <div className="p-6">
        {/* Category Badge */}
        {post.category && (
          <Badge 
            variant="secondary" 
            className="mb-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-0"
          >
            {post.category.icon} {post.category.name}
          </Badge>
        )}
        
        {/* Title */}
        <Link to={`/blog/${post.slug}`} className="group/link">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover/link:text-indigo-600 dark:group-hover/link:text-indigo-400 transition-colors">
            {post.title}
          </h2>
        </Link>
        
        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                to={`/blog/etiket/${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300 transition-colors"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            {post.author?.avatar_url ? (
              <img
                src={post.author.avatar_url}
                alt={post.author.full_name || 'Yazar'}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                {(post.author?.full_name || post.author?.username || 'U').charAt(0)}
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {post.author?.full_name || post.author?.username || 'Anonim'}
              </span>
              <p className="text-xs text-slate-500">{formattedDate}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
              <Eye className="w-4 h-4" />
              {post.view_count}
            </span>
            <span className="flex items-center gap-1 hover:text-rose-500 transition-colors">
              <Heart className="w-4 h-4" />
              {post.like_count}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
