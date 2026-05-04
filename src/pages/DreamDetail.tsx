import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, Heart, Bookmark, ArrowLeft, Calendar, BookOpen, Moon, Brain } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { SimilarDreams } from '@/components/dream/SimilarDreams';
import { SocialShareBar } from '@/components/dream/SocialShareBar';
import { CommentSection } from '@/components/dream/CommentSection';
import { dreamsApi, type Dream, type Comment, type ApiResponse } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { JsonLd, buildDreamSchema, buildBreadcrumbSchema } from '@/components/seo/JsonLd';

// SEO Meta component
function DreamMeta({ dream }: { dream: Dream }) {
  useEffect(() => {
    document.title = dream.meta_title || `${dream.title} - Rüya Tabiri`;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', dream.meta_description || dream.content.slice(0, 160));
    }

    return () => {
      document.title = 'Rüya Tabiri';
    };
  }, [dream]);

  return null;
}

export default function DreamDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [favoriteAnimation, setFavoriteAnimation] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dream query
  const {
    data: dreamResponse,
    isLoading: isDreamLoading,
    error: dreamError
  } = useQuery({
    queryKey: queryKeys.dreams.bySlug(slug!),
    queryFn: () => dreamsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  const dream = dreamResponse?.success ? dreamResponse.data : null;

  // Fetch comments query
  const {
    data: commentsResponse,
    isLoading: isCommentsLoading
  } = useQuery({
    queryKey: queryKeys.comments.byDream(dream?.id || ''),
    queryFn: () => dreamsApi.getComments(dream!.id),
    enabled: !!dream?.id,
  });

  const comments = commentsResponse?.success ? commentsResponse.data : [];

  // Mutations
  const likeMutation = useMutation({
    mutationFn: (id: string) => dreamsApi.like(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dreams.bySlug(slug!) });
      } else {
        toast.error(response.error || 'Beğeni işlemi başarısız');
      }
    },
    onError: () => toast.error('Bir hata oluştu'),
  });

  const favoriteMutation = useMutation({
    mutationFn: (id: string) => dreamsApi.favorite(id) as Promise<ApiResponse<{ favorited: boolean }>>,
    onSuccess: (response) => {
      if (response.success && response.data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dreams.bySlug(slug!) });
        toast.success(response.data.favorited ? 'Favorilere eklendi' : 'Favorilerden kaldırıldı');
      } else {
        toast.error(response.error || 'Favori işlemi başarısız');
      }
    },
    onError: () => toast.error('Bir hata oluştu'),
  });

  const animatedToggleLike = () => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }
    if (!dream) return;
    setLikeAnimation(true);
    likeMutation.mutate(dream.id);
    setTimeout(() => setLikeAnimation(false), 300);
  };

  const animatedToggleFavorite = () => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }
    if (!dream) return;
    setFavoriteAnimation(true);
    favoriteMutation.mutate(dream.id);
    setTimeout(() => setFavoriteAnimation(false), 300);
  };

  const isLiked = dream?.isLiked || false;
  const isFavorite = dream?.isFavorited || false;

  if (isDreamLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="max-w-3xl mx-auto animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-4" />
            <div className="h-10 bg-muted rounded w-3/4 mb-6" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-full mb-2" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!dream) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Rüya Bulunamadı</h1>
          <p className="text-muted-foreground mb-6">Aradığınız rüya tabiri mevcut değil.</p>
          <Button asChild>
            <Link to="/">Ana Sayfaya Dön</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <DreamMeta dream={(dream as any)} />
      <JsonLd data={buildDreamSchema((dream as any))} />
      <JsonLd data={buildBreadcrumbSchema([
        { name: 'Ana Sayfa', url: 'https://ruyatabirleri.com/' },
        { name: dream.category_name || 'Rüya Tabirleri', url: `https://ruyatabirleri.com/kategori/${dream.category_slug || ''}` },
        { name: dream.title, url: `https://ruyatabirleri.com/ruya/${dream.slug}` },
      ])} />

      {/* Floating Share Bar - visible on scroll */}
      <SocialShareBar
        title={dream.title}
        description={dream.content.slice(0, 160)}
        variant="floating"
      />

      <article className="container py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ana Sayfaya Dön
            </Link>
          </Button>

          {/* Header */}
          <header className="mb-8">
            {dream.category_slug && (
              <Link
                to={`/kategori/${dream.category_slug}`}
                className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary mb-4 hover:bg-primary/20 transition-colors"
              >
                {dream.category_name}
              </Link>
            )}

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
              {dream.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{(dream.view_count || 0).toLocaleString('tr-TR')} görüntülenme</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{(dream.like_count || 0).toLocaleString('tr-TR')} beğeni</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(dream.created_at).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          </header>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-8 pb-8 border-b border-border">
            <Button
              variant={isLiked ? 'default' : 'outline'}
              size="sm"
              onClick={animatedToggleLike}
              className={`transition-all duration-200 ${isLiked ? 'dream-gradient' : ''} ${likeAnimation ? 'scale-110' : 'scale-100'}`}
            >
              <Heart className={`mr-2 h-4 w-4 transition-transform duration-200 ${isLiked ? 'fill-current' : ''} ${likeAnimation ? 'scale-125' : 'scale-100'}`} />
              {isLiked ? 'Beğenildi' : 'Beğen'}
              {(dream.like_count || 0) > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-background/20">
                  {dream.like_count}
                </span>
              )}
            </Button>
            <Button
              variant={isFavorite ? 'default' : 'outline'}
              size="sm"
              onClick={animatedToggleFavorite}
              className={`transition-all duration-200 ${isFavorite ? 'dream-gradient' : ''} ${favoriteAnimation ? 'scale-110' : 'scale-100'}`}
            >
              <Bookmark className={`mr-2 h-4 w-4 transition-transform duration-200 ${isFavorite ? 'fill-current' : ''} ${favoriteAnimation ? 'scale-125' : 'scale-100'}`} />
              {isFavorite ? 'Kaydedildi' : 'Kaydet'}
            </Button>

            {/* Compact Share Buttons */}
            <SocialShareBar
              title={dream.title}
              description={dream.content.slice(0, 160)}
              variant="compact"
            />
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="general" className="mb-12">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 hidden sm:block" />
                Genel
              </TabsTrigger>
              <TabsTrigger value="islamic" className="flex items-center gap-2">
                <Moon className="h-4 w-4 hidden sm:block" />
                İslami
              </TabsTrigger>
              <TabsTrigger value="psychological" className="flex items-center gap-2">
                <Brain className="h-4 w-4 hidden sm:block" />
                Psikolojik
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-6">
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{dream.content}</p>
              </div>
            </TabsContent>
            <TabsContent value="islamic" className="mt-6">
              {dream.islamic_interpretation ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{dream.islamic_interpretation}</p>
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                  <Moon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Bu rüya için İslami yorum henüz eklenmemiştir.</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="psychological" className="mt-6">
              {dream.psychological_interpretation ? (
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">{dream.psychological_interpretation}</p>
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Bu rüya için psikolojik yorum henüz eklenmemiştir.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Keywords */}
          {Array.isArray(dream.keywords) && dream.keywords.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-serif font-semibold mb-4">İlgili Anahtar Kelimeler</h3>
              <div className="flex flex-wrap gap-2">
                {dream.keywords.map((keyword) => (
                  <Link
                    key={keyword}
                    to={`/ara?q=${encodeURIComponent(keyword)}`}
                    className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {keyword}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Similar Dreams */}
          <SimilarDreams
            currentDream={dream}
            categoryId={dream.category_id}
            keywords={dream.keywords || []}
          />

          {/* Social Share Section */}
          <div className="mb-12">
            <SocialShareBar
              title={dream.title}
              description={dream.content.slice(0, 160)}
              variant="inline"
              showLabels
            />
          </div>

          {/* Comments Section */}
          <CommentSection
            dreamId={dream.id}
            comments={comments as any}
            isLoading={isCommentsLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: queryKeys.comments.byDream(dream.id) })}
          />
        </div>
      </article>
    </Layout>
  );
}
