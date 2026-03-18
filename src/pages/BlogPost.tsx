import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Eye,
  Heart,
  Share2,
  Tag,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { blogApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { BlogPost as BlogPostType } from '@/types/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogCommentSection } from '@/components/blog/BlogCommentSection';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ReadingProgressBar } from '@/components/blog/ReadingProgressBar';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [authorBio, setAuthorBio] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  useEffect(() => {
    if (post && user) {
      setIsLiked(post.isLiked || false);
    }
  }, [post, user]);

  const fetchPost = async () => {
    setIsLoading(true);

    const response = await blogApi.getPostBySlug(slug!);

    if (!response.success || !response.data) {
      navigate('/blog');
      return;
    }

    const data = response.data;

    const postData: BlogPostType = {
      ...data,
      category: data.category_id ? {
        id: data.category_id,
        name: data.category_name || '',
        slug: '',
        icon: '',
      } : undefined,
      author: data.author_name ? {
        id: data.author_id,
        full_name: data.author_name,
        username: data.author_name,
        avatar_url: data.author_avatar,
      } : undefined,
    };

    setPost(postData);
    setAuthorBio(null);
    setLikeCount(postData.like_count || 0);
    setIsLiked(postData.isLiked || false);

    // Fetch related posts
    if (data.category_id) {
      const relatedResponse = await blogApi.getPosts({
        category_id: data.category_id,
        limit: 3,
      });

      if (relatedResponse.success && relatedResponse.data) {
        const relatedData = relatedResponse.data.filter((p) => p.id !== data.id);
        
        setRelatedPosts(
          relatedData.map((p) => ({
            ...p,
            category: p.category_id ? {
              id: p.category_id,
              name: p.category_name || '',
              slug: '',
              icon: '',
            } : undefined,
            author: p.author_name ? {
              id: p.author_id,
              full_name: p.author_name,
              username: p.author_name,
              avatar_url: p.author_avatar,
            } : undefined,
          })) as BlogPostType[]
        );
      }
    }

    setIsLoading(false);
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }

    if (!post) return;

    const response = await blogApi.likePost(post.id);

    if (response.success && response.data) {
      setIsLiked(response.data.liked);
      setLikeCount((prev) => response.data!.liked ? prev + 1 : prev - 1);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || '',
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  const readingTime = post
    ? Math.ceil(post.content.split(/\s+/).length / 200)
    : 0;

  if (isLoading) {
    return (
      <Layout>
        <PageTransition>
          <div className="container py-16">
            <div className="max-w-4xl mx-auto animate-pulse space-y-8">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded-2xl" />
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-6 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        </PageTransition>
      </Layout>
    );
  }

  if (!post) return null;

  return (
    <Layout>
      <PageTransition>
        <article className="min-h-screen bg-gradient-to-b from-background to-muted/30">
          <ReadingProgressBar />

          {/* Breadcrumb */}
          <div className="container py-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">
                Ana Sayfa
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/blog" className="hover:text-primary transition-colors">
                Blog
              </Link>
              {post.category && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <Link
                    to={`/blog?kategori=${post.category.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {post.category.name}
                  </Link>
                </>
              )}
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {post.title}
              </span>
            </nav>
          </div>

          {/* Header */}
          <header className="container pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {post.category && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                    {post.category.icon} {post.category.name}
                  </Badge>
                )}
                {post.is_featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    ✨ Öne Çıkan
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 ring-2 ring-border">
                    <AvatarImage src={post.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
                      {(post.author?.full_name || post.author?.username || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {post.author?.full_name || post.author?.username || 'Anonim'}
                    </p>
                    <p className="text-xs text-muted-foreground">Yazar</p>
                  </div>
                </div>

                <Separator orientation="vertical" className="h-10 hidden sm:block" />

                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.created_at), 'd MMMM yyyy', { locale: tr })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {readingTime} dk okuma
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {post.view_count} görüntüleme
                  </span>
                </div>
              </div>
            </motion.div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="container pb-12"
            >
              <div className="max-w-4xl mx-auto">
                <div className="rounded-3xl overflow-hidden border border-border shadow-xl">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <div className="container pb-16">
            <div className="max-w-4xl mx-auto">
              {/* Table of Contents */}
              <TableOfContents content={post.content} className="mb-8" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/blog/etiket/${encodeURIComponent(tag)}`}
                    >
                      <Badge
                        variant="secondary"
                        className="gap-1.5 cursor-pointer bg-muted/60 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all duration-200"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 py-6 border-t border-b border-border mb-12">
                <Button
                  variant={isLiked ? 'default' : 'outline'}
                  size="lg"
                  onClick={handleLike}
                  className={isLiked ? 'bg-red-500 hover:bg-red-600 border-red-500' : ''}
                >
                  <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                  {likeCount} Beğeni
                </Button>
                <Button variant="outline" size="lg" onClick={handleShare}>
                  <Share2 className="w-5 h-5 mr-2" />
                  Paylaş
                </Button>
              </div>

              {/* Author Bio Card */}
              {authorBio && (
                <div className="bg-card rounded-2xl border border-border p-6 mb-12">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-14 h-14 ring-2 ring-border">
                      <AvatarImage src={post.author?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold text-lg">
                        {(post.author?.full_name || post.author?.username || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground text-lg">
                        {post.author?.full_name || post.author?.username || 'Anonim'}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{authorBio}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments */}
              <BlogCommentSection postId={post.id} />

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    İlgili Yazılar
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {relatedPosts.map((relatedPost) => (
                      <BlogCard key={relatedPost.id} post={relatedPost} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>
      </PageTransition>
    </Layout>
  );
}
