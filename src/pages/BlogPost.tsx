import { useState, useEffect, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
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
  Type,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BlogPost as BlogPostData } from '@/types/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { BlogCommentSection } from '@/components/blog/BlogCommentSection';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ReadingProgressBar } from '@/components/blog/ReadingProgressBar';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ResponsiveImage } from '@/components/ui/ResponsiveImage';
import { Seo } from '@/components/Seo';
import { nativeShare } from '@/lib/share';
import { haptic } from '@/lib/haptics';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

type TextSize = 'sm' | 'base' | 'lg';

const textSizeClasses: Record<TextSize, string> = {
  sm: 'prose-base',
  base: 'prose-lg',
  lg: 'prose-xl',
};

function TextSizeControls({ value, onChange }: { value: TextSize; onChange: (value: TextSize) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/45 bg-muted/30 p-1">
      <Type className="ml-2 h-4 w-4 text-muted-foreground" />
      {(['sm', 'base', 'lg'] as TextSize[]).map((size) => (
        <Button
          key={size}
          type="button"
          variant={value === size ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onChange(size)}
          className="h-8 rounded-lg px-2.5"
          aria-pressed={value === size}
        >
          {size === 'sm' ? 'A-' : size === 'lg' ? 'A+' : 'A'}
        </Button>
      ))}
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [authorBio, setAuthorBio] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [textSize, setTextSize] = useState<TextSize>('base');
  const isMountedRef = useRef(true);

  const checkIfLiked = useCallback(async () => {
    if (!post || !user) return;

    const { data } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();

    setIsLiked(!!data);
  }, [post, user]);

  const fetchPost = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
        *,
        category:blog_categories(id, name, slug, icon)
      `)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (!isMountedRef.current) return;

      if (error || !data) {
        navigate('/blog');
        return;
      }

      // Fetch author profile separately
      const { data: authorData } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url, bio')
        .eq('user_id', data.author_id)
        .maybeSingle();

      if (!isMountedRef.current) return;

      const postData = {
        id: data.id,
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        featured_image: data.featured_image,
        category_id: data.category_id,
        author_id: data.author_id,
        is_published: data.is_published ?? false,
        is_featured: data.is_featured ?? false,
        view_count: data.view_count ?? 0,
        like_count: data.like_count ?? 0,
        meta_title: data.meta_title,
        meta_description: data.meta_description,
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.category as BlogPostData['category'],
        ...(authorData
          ? {
              author: {
                id: authorData.user_id,
                full_name: authorData.full_name,
                username: authorData.username,
                avatar_url: authorData.avatar_url,
              },
            }
          : {}),
      } as BlogPostData;

      setPost(postData);
      setAuthorBio(authorData?.bio || null);
      setLikeCount(postData.like_count);

      // Increment view count
      await supabase.rpc('increment_blog_view_count', { post_id: data.id });

      // Fetch related posts
      if (data.category_id) {
        const { data: relatedData } = await supabase
          .from('blog_posts')
          .select(`
          *,
          category:blog_categories(id, name, slug, icon)
        `)
          .eq('is_published', true)
          .eq('category_id', data.category_id)
          .neq('id', data.id)
          .limit(3);

        if (relatedData && isMountedRef.current) {
          // Fetch author profiles for related posts
          const authorIds = [...new Set(relatedData.map((p) => p.author_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, username, avatar_url')
            .in('user_id', authorIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));

          setRelatedPosts(
            relatedData.map((p) => {
              const author = profileMap.get(p.author_id);
              return {
                id: p.id,
                title: p.title,
                slug: p.slug,
                content: p.content,
                excerpt: p.excerpt,
                featured_image: p.featured_image,
                category_id: p.category_id,
                author_id: p.author_id,
                is_published: p.is_published ?? false,
                is_featured: p.is_featured ?? false,
                view_count: p.view_count ?? 0,
                like_count: p.like_count ?? 0,
                meta_title: p.meta_title,
                meta_description: p.meta_description,
                tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
                created_at: p.created_at,
                updated_at: p.updated_at,
                category: p.category as BlogPostData['category'],
                ...(author
                  ? {
                      author: {
                        id: author.user_id,
                        full_name: author.full_name,
                        username: author.username,
                        avatar_url: author.avatar_url,
                      },
                    }
                  : {}),
              } as BlogPostData;
            })
          );
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('fetchPost error:', err);
        navigate('/blog');
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    isMountedRef.current = true;
    if (slug) {
      fetchPost();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [slug, fetchPost]);

  useEffect(() => {
    if (post && user) {
      checkIfLiked();
    }
  }, [post, user, checkIfLiked]);

  const seoTitle = post?.meta_title || post?.title;
  const seoDescription = post?.meta_description || post?.excerpt || undefined;
  const seoImage = post?.featured_image || undefined;
  const seoPath = post ? `/blog/${post.slug}` : '/blog';
  const blogJsonLd = post ? [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: seoTitle,
      description: seoDescription,
      image: seoImage ? absoluteUrl(seoImage) : absoluteUrl('/og-image.png'),
      url: absoluteUrl(seoPath),
      datePublished: post.created_at,
      dateModified: post.updated_at || post.created_at,
      author: {
        '@type': 'Person',
        name: post.author?.full_name || post.author?.username || SITE_NAME,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: absoluteUrl('/pwa-512x512.png') },
      },
      mainEntityOfPage: absoluteUrl(seoPath),
      articleSection: post.category?.name,
      keywords: post.tags?.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
        ...(post.category ? [{ '@type': 'ListItem', position: 3, name: post.category.name, item: absoluteUrl(`/blog?kategori=${post.category.slug}`) }] : []),
        { '@type': 'ListItem', position: post.category ? 4 : 3, name: post.title, item: absoluteUrl(seoPath) },
      ],
    },
  ] : undefined;

  const handleLike = async () => {
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }

    if (!post) return;

    if (isLiked) {
      await supabase
        .from('blog_likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
      haptic('light');
    } else {
      await supabase.from('blog_likes').insert({
        post_id: post.id,
        user_id: user.id,
      });

      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      haptic('success');
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const result = await nativeShare({
      title: post.title,
      text: post.excerpt || '',
      url: window.location.href,
    });
    if (result === 'copied') {
      toast.success('Link kopyalandı!');
      haptic('light');
    } else if (result === 'shared') {
      haptic('success');
    }
  };

  const readingTime = post
    ? Math.ceil(post.content.split(/\s+/).length / 200)
    : 0;

  if (isLoading) {
    return (
      <Layout>
        <Seo title="Yükleniyor..." path="/blog" noindex />
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
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={seoPath}
        image={seoImage}
        type="article"
        jsonLd={blogJsonLd}
      />
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
                    <CategoryIcon icon={post.category.icon} className="h-3.5 w-3.5" /> {post.category.name}
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
                  <ResponsiveImage
                    src={post.featured_image}
                    alt={post.title}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    fallbackWidth={1200}
                    widths={[640, 960, 1200, 1600]}
                    sizes="(max-width: 768px) 100vw, 896px"
                    aspectRatio="16/9"
                    className="h-auto w-full object-cover"
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
              <div className="mb-6 flex justify-end">
                <TextSizeControls value={textSize} onChange={setTextSize} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`prose ${textSizeClasses[textSize]} dark:prose-invert max-w-none mb-12 prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-p:leading-[1.85]`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content, {
                  ALLOWED_TAGS: ['p','br','strong','em','u','s','h1','h2','h3','h4','h5','h6',
                    'ul','ol','li','blockquote','code','pre','a','img',
                    'table','thead','tbody','tr','th','td','hr','figure','figcaption'],
                  ALLOWED_ATTR: ['href','src','alt','class','target','rel','loading'],
                  FORBID_TAGS: ['script','style','iframe'],
                  FORBID_ATTR: ['onerror','onload','onclick','onmouseover'],
                }) }}
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
              {settings.enableComments && (
                <BlogCommentSection postId={post.id} />
              )}

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
