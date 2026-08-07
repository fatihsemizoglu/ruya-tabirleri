import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import { Moon, ArrowLeft, BookOpen, PenLine } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { captureError } from '@/lib/logger';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { SimilarDreams } from '@/components/dream/SimilarDreams';
import { CommentSection } from '@/components/dream/CommentSection';
import { ShareCard } from '@/components/share/ShareCard';
import { ReadingProgress } from '@/components/dream/ReadingProgress';
import { ReadingControls } from '@/components/dream/ReadingControls';
import { ContentCard } from '@/components/dream/ContentCard';
import { DreamHero } from '@/components/dream/DreamHero';
import { DreamActionBar } from '@/components/dream/DreamActionBar';
import { DreamFaq } from '@/components/dream/DreamFaq';
import { DreamKeywordTags } from '@/components/dream/DreamKeywordTags';
import type { Dream, Comment, Profile, Category } from '@/types/database';
import { Seo } from '@/components/Seo';
import { absoluteUrl, SITE_NAME } from '@/lib/site';
import { formatPlainDreamContent } from '@/lib/dreamContent';
import { useDreamCompare } from '@/hooks/useDreamCompare';
import { useReadingMode } from '@/hooks/useReadingMode';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { textSizeClasses, lineSpacingClasses } from '@/lib/dream-reading';
import type { TextSize, LineSpacing } from '@/lib/dream-reading';

const gradientPalette = [
  'from-violet-500 to-fuchsia-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
];

const pickGradient = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return gradientPalette[Math.abs(hash) % gradientPalette.length] ?? 'from-violet-500 to-fuchsia-500';
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

async function incrementDreamViewCount(dreamId: string) {
  return (supabase.rpc as unknown as (name: string, args?: Record<string, unknown>) => Promise<{ error: unknown }>)("increment_view_count", { dream_id: dreamId });
}

export default function DreamDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSiteSettings();
  const latestSlugRef = useRef(slug);
  latestSlugRef.current = slug;
  const [dream, setDream] = useState<Dream | null>(null);
  const [comments, setComments] = useState<(Comment & { profiles?: Profile })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [favoriteAnimation, setFavoriteAnimation] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>('base');
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>('relaxed');
  const { user } = useAuth();
  const compare = useDreamCompare();
  const readingMode = useReadingMode();
  const wakeLock = useWakeLock();
  const speech = useSpeechSynthesis();

  const fetchComments = useCallback(async (dreamId: string) => {
    setCommentsLoading(true);
    try {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('dream_id', dreamId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: profilesMap.get(comment.user_id),
      }));

      setComments(commentsWithProfiles as unknown as (Comment & { profiles?: Profile })[]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const fetchDream = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: dreamData, error } = await supabase
        .from('dreams')
        .select('*, category:categories(*)')
        .eq('slug', slug ?? '')
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      if (slug !== latestSlugRef.current) return;
      if (!dreamData) {
        setDream(null);
        return;
      }

      setDream(dreamData as Dream);

      const viewPromise = incrementDreamViewCount(dreamData.id);
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => fetchComments(dreamData.id), { timeout: 2000 });
      } else {
        window.setTimeout(() => fetchComments(dreamData.id), 500);
      }

      if (user) {
        const [viewResult, historyResult, favResult, likeResult] = await Promise.all([
          viewPromise,
          supabase.from('view_history').insert({
            user_id: user.id,
            dream_id: dreamData.id,
          }),
          supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('dream_id', dreamData.id)
            .maybeSingle(),
          supabase
            .from('dream_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('dream_id', dreamData.id)
            .maybeSingle(),
        ]);

        if (viewResult.error) captureError(viewResult.error, { tags: { feature: 'dream-detail' }, extra: { context: 'increment-view' } });
        if (historyResult.error) captureError(historyResult.error, { tags: { feature: 'dream-detail' }, extra: { context: 'save-history' } });
        if (favResult.error) captureError(favResult.error, { tags: { feature: 'dream-detail' }, extra: { context: 'fetch-favorite' } });
        if (likeResult.error) captureError(likeResult.error, { tags: { feature: 'dream-detail' }, extra: { context: 'fetch-like' } });

        if (slug !== latestSlugRef.current) return;
        if (!viewResult.error) {
          setDream((prev) => (prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev));
        }
        setIsFavorite(!!favResult.data);
        setIsLiked(!!likeResult.data);
      } else {
        const { error: viewError } = await viewPromise;
        if (viewError) captureError(viewError, { tags: { feature: 'dream-detail' }, extra: { context: 'increment-view-guest' } });
        if (slug !== latestSlugRef.current) return;
        if (!viewError) {
          setDream((prev) => (prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev));
        }
      }

    } catch (error) {
      captureError(error, { tags: { feature: 'dream-detail' }, extra: { context: 'fetch-dream' } });
    } finally {
      setIsLoading(false);
    }
  }, [slug, user, fetchComments]);

  useEffect(() => {
    if (slug) {
      fetchDream();
    }
  }, [slug, fetchDream]);

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }
    if (!dream) return;

    try {
      if (isFavorite) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('dream_id', dream.id);
        setIsFavorite(false);
        toast.success('Favorilerden kaldırıldı');
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, dream_id: dream.id });
        setIsFavorite(true);
        toast.success('Favorilere eklendi');
      }
    } catch {
      toast.error('Bir hata oluştu');
    }
  }, [user, dream, isFavorite]);

  const saveToJournal = useCallback(async () => {
    if (!user) {
      toast.error('Günlüğe kaydetmek için giriş yapmalısınız');
      return;
    }
    if (!dream) return;

    const plainContent = (dream.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const content = `${dream.title}\n\n${plainContent}`.slice(0, 5000);

    try {
      const { error } = await supabase.from('dream_journal').insert({
        user_id: user.id,
        title: dream.title,
        content,
        dream_date: new Date().toISOString().split('T')[0],
        tags: dream.keywords ?? [],
      } as never);
      if (error) throw error;
      toast.success('Rüya günlüğünüze kaydedildi');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rüya günlüğüne kaydedilemedi';
      toast.error(message);
    }
  }, [dream, user]);

  // Swipe gesture: right swipe to favorite, left swipe to share (touch only)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      // Etkileşimli öğelerden başlayan hareketleri devralma
      // (link, buton, input, carousel vb. üzerinde swipe tetikleme)
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest('button, a, input, textarea, select, [role="button"], [role="link"], [contenteditable="true"]')
      ) {
        return;
      }
      startX = e.touches[0]?.clientX ?? 0;
      startY = e.touches[0]?.clientY ?? 0;
      tracking = true;
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > 60) return; // mostly vertical
      // Net bir yatay hareket değilse tetikleme (kaydırma sırasında yanlışlıkla)
      if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      if (dx > 0) {
        toggleFavorite();
      } else {
        navigator.clipboard?.writeText(window.location.href).then(() => {
          toast.success('Link kopyalandı');
        }).catch(() => {});
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend', onEnd);
    };
  }, [user, isFavorite, dream, toggleFavorite]);

  const toggleLike = async () => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }
    if (!dream) return;

    try {
      if (isLiked) {
        await supabase.from('dream_likes').delete().eq('user_id', user.id).eq('dream_id', dream.id);
        setIsLiked(false);
        setDream({ ...dream, like_count: (dream.like_count || 1) - 1 });
      } else {
        await supabase.from('dream_likes').insert({ user_id: user.id, dream_id: dream.id });
        setIsLiked(true);
        setDream({ ...dream, like_count: (dream.like_count || 0) + 1 });
      }
    } catch {
      toast.error('Bir hata oluştu');
    }
  };

  const animatedToggleLike = async () => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }
    setLikeAnimation(true);
    await toggleLike();
    setTimeout(() => setLikeAnimation(false), 300);
  };

  const animatedToggleFavorite = async () => {
    if (!user) {
      toast.error('Giriş yapmalısınız');
      return;
    }
    setFavoriteAnimation(true);
    await toggleFavorite();
    setTimeout(() => setFavoriteAnimation(false), 300);
  };

  const addToCompare = () => {
    if (!dream) return;
    compare.add(dream.id);
    toast.success('Karşılaştırma listesine eklendi', {
      action: {
        label: 'Aç',
        onClick: () => window.location.assign('/karsilastir'),
      },
    });
  };

  const toggleWakeLock = async () => {
    if (wakeLock.isActive) await wakeLock.release();
    else await wakeLock.request();
  };

  const speakDream = () => {
    if (!dream) return;
    const text = `${dream.title}. ${safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`;
    speech.speak(text.slice(0, 12000));
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-mesh">
          <div className="container py-12">
            <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-2xl bg-muted" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-10 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 surface rounded-2xl" />
                ))}
              </div>
              <div className="h-12 surface rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!dream) {
    return (
      <Layout>
        <div className="min-h-screen bg-mesh">
          <div className="container py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-8">
                <Moon className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-serif-dream font-bold mb-4">Rüya Bulunamadı</h1>
              <p className="text-muted-foreground mb-8">
                Aradığınız rüya tabiri mevcut değil veya kaldırılmış olabilir.
              </p>
              <Button asChild size="lg" className="rounded-xl dream-gradient">
                <Link to="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ana Sayfaya Dön
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  const safeContent = dream.content || '';
  const category = dream.category as Category;
  const heroGradient = pickGradient(dream.id + dream.slug);
  const formattedDate = new Date(dream.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const wordCount = safeContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  let formattedContent = '';
  try {
    formattedContent = DOMPurify.sanitize(formatPlainDreamContent(safeContent, dream.title), {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'figure', 'figcaption'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'loading'],
      FORBID_TAGS: ['script', 'style', 'iframe'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
  } catch {
    const plainFallback = safeContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 5000);
    formattedContent = `<p>${escapeHtml(plainFallback)}</p>`;
  }
  const dreamPath = `/ruya/${dream.slug}`;
  const dreamDescription = dream.meta_description || safeContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) || `${dream.title} rüya tabiri ve yorumu`;

  const islamicSnippet = (dream.islamic_interpretation || safeContent).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  const psychSnippet = (dream.psychological_interpretation || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  const dreamFaqs = [
    {
      q: `${dream.title} görmek ne anlama gelir?`,
      a: islamicSnippet ? `${islamicSnippet}…` : `${dream.title} rüyası, rüya sahibinin yaşamındaki sembolik işaretlere dair yorumlanır. Detaylı açıklamayı sayfada inceleyebilirsiniz.`,
    },
    {
      q: `${dream.title} görmek dinen nasıl yorumlanır?`,
      a: dream.islamic_interpretation
        ? `${islamicSnippet}…`
        : `${dream.title} rüyasının dinî yorumu için uzman görüşüne başvurulması tavsiye edilir; genel açıklama sayfada yer almaktadır.`,
    },
    ...(psychSnippet
      ? [{
          q: `${dream.title} görmek psikolojik açıdan ne ifade eder?`,
          a: `${psychSnippet}…`,
        }]
      : []),
    {
      q: `Rüyada ${dream.title.toLocaleLowerCase('tr-TR')} görmek hayırlı mıdır?`,
      a: `Rüya yorumu bağlama göre değişir. ${dream.title} rüyasının anlamını kişisel durumunuzu göz önünde bulundurarak değerlendirmeniz önerilir.`,
    },
  ];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dreamFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const dreamJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: dream.meta_title || dream.title,
      description: dreamDescription,
      url: absoluteUrl(dreamPath),
      datePublished: dream.created_at,
      dateModified: dream.updated_at || dream.created_at,
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: absoluteUrl('/pwa-512x512.png') },
      },
      mainEntityOfPage: absoluteUrl(dreamPath),
      articleSection: category?.name,
      keywords: dream.keywords?.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: absoluteUrl('/') },
        ...(category ? [{ '@type': 'ListItem', position: 2, name: category.name, item: absoluteUrl(`/kategori/${category.slug}`) }] : []),
        { '@type': 'ListItem', position: category ? 3 : 2, name: dream.title, item: absoluteUrl(dreamPath) },
      ],
    },
    faqJsonLd,
  ];

  return (
    <Layout>
      <Seo
        title={dream.meta_title || dream.title}
        description={dreamDescription}
        path={dreamPath}
        type="article"
        jsonLd={dreamJsonLd}
      />
      <ReadingProgress />

      {/* Hero Section */}
      <DreamHero
        dream={dream}
        category={category}
        heroGradient={heroGradient}
        formattedDate={formattedDate}
        readTime={readTime}
      />

      {/* Content */}
      <section className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="max-w-3xl mx-auto"
        >
          <ContentCard icon={BookOpen} gradient="from-blue-500 to-cyan-500" title="Rüya Tabiri">
            <div className="mb-6 flex justify-end">
              <ReadingControls
                textSize={textSize}
                onTextSizeChange={setTextSize}
                lineSpacing={lineSpacing}
                onLineSpacingChange={setLineSpacing}
                isReadingMode={readingMode.isReadingMode}
                onToggleReadingMode={readingMode.toggle}
                wakeLockActive={wakeLock.isActive}
                onToggleWakeLock={toggleWakeLock}
                speechSupported={speech.isSupported}
                isSpeaking={speech.isSpeaking}
                isPaused={speech.isPaused}
                onSpeak={speakDream}
                onPause={speech.pause}
                onResume={speech.resume}
                onStop={speech.stop}
              />
            </div>
            <div
              className={`dream-content reading-content prose ${textSizeClasses[textSize]} ${lineSpacingClasses[lineSpacing]} dark:prose-invert max-w-none prose-headings:font-serif-dream prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-primary/90 prose-p:text-foreground/85 prose-p:mb-5 prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80 prose-strong:text-foreground prose-img:rounded-xl`}
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </ContentCard>
        </motion.div>
      </section>

      {/* Keywords */}
      {dream.keywords && dream.keywords.length > 0 && (
        <DreamKeywordTags keywords={dream.keywords} />
      )}

      <section className="container pb-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-background p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif-dream text-xl font-bold">Bu rüyayla devam edin</h2>
              <p className="mt-1 text-sm text-muted-foreground">Bu tabiri rüya günlüğünüze ekleyerek daha sonra kolayca erişin.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={saveToJournal} className="rounded-xl">
                <PenLine className="mr-2 h-4 w-4" />
                Günlüğüme Kaydet
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <DreamActionBar
        dream={dream}
        isLiked={isLiked}
        isFavorite={isFavorite}
        likeAnimation={likeAnimation}
        favoriteAnimation={favoriteAnimation}
        onToggleLike={animatedToggleLike}
        onToggleFavorite={animatedToggleFavorite}
        onAddToCompare={addToCompare}
        isInCompare={compare.isSelected(dream.id)}
        shareUrl={shareUrl}
      />

      {/* Share and Actions Card */}
      <section className="container pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="max-w-3xl mx-auto"
        >
          <ShareCard
            title={dream.title}
            description={(dream.content || '').slice(0, 160)}
          />
        </motion.div>
      </section>

      {/* FAQ — Sıkça Sorulan Sorular */}
      <DreamFaq faqs={dreamFaqs} />

      {/* Similar Dreams */}
      <section className="container pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.57 }}
          className="max-w-3xl mx-auto"
        >
          <SimilarDreams
            currentDream={dream}
            categoryId={dream.category_id}
          />
        </motion.div>
      </section>

      {/* Comments */}
      {settings.enableComments && (
        <section className="container pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <CommentSection
              dreamId={dream.id}
              comments={comments}
              isLoading={commentsLoading}
              onRefresh={() => fetchComments(dream.id)}
            />
          </motion.div>
        </section>
      )}
    </Layout>
  );
}
