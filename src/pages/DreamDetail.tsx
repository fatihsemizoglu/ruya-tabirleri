import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Eye, Heart, Bookmark, ArrowLeft, Calendar, BookOpen, Sparkles, Clock, ChevronRight, Share2, Tag, Folder, Check, Moon, Type, PenLine } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { SimilarDreams } from '@/components/dream/SimilarDreams';
import { CommentSection } from '@/components/dream/CommentSection';
import { ShareCard } from '@/components/share/ShareCard';
import type { Dream, Comment, Profile, Category } from '@/types/database';
import { Seo } from '@/components/Seo';
import { nativeShare } from '@/lib/share';
import { haptic } from '@/lib/haptics';
import { absoluteUrl, SITE_NAME } from '@/lib/site';

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

const pickGradient = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return gradientPalette[Math.abs(hash) % gradientPalette.length];
};

const purifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'span', 'hr', 'pre', 'code', 'sup', 'sub', 'mark'],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload'],
};

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, purifyConfig);
}

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function looksLikeHeading(line: string): boolean {
  const text = line.trim();
  if (!text || text.length > 90) return false;
  if (/[:：]$/.test(text)) return true;
  if (/^(Rüyada|Rüya|Boğa|Yılan|Kara|Siyah|Beyaz|Yeşil|Sarı|Kırmızı|Su|Ev|Para|Altın|Bebek|Köpek|Kedi)\b/i.test(text) && !/[.!?]$/.test(text)) return true;
  return false;
}

const inlineHeadingPattern = /(?:Rüyada|Rüya|Boğa|Yılan|Kara|Siyah|Beyaz|Yeşil|Sarı|Kırmızı)[^.!?\n]{3,70}?görmek/gi;

function splitInlineHeadings(line: string): string[] {
  const parts: string[] = [];
  const matches = [...line.matchAll(inlineHeadingPattern)];

  if (matches.length <= 1) return [line];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? line.length;

    if (index === 0 && start > 0) {
      const intro = line.slice(0, start).trim();
      if (intro) parts.push(intro);
    }

    const section = line.slice(start, end).trim();
    if (section) parts.push(section);
  }

  return parts.length ? parts : [line];
}

function normalizeTitleToken(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\b(rüyada|rüya|ruyada|ruya|görmek|gormek|gördüğünü|gordugunu|görmek nedir|ne anlama gelir)\b/gi, ' ')
    .replace(/[^a-zçğıöşü0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeTrailingTitleRepeat(lines: string[], title: string): string[] {
  if (lines.length < 2) return lines;

  const titleToken = normalizeTitleToken(title);
  if (!titleToken) return lines;

  const lastLine = lines[lines.length - 1];
  const lastToken = normalizeTitleToken(lastLine);
  const lastWordCount = lastToken.split(' ').filter(Boolean).length;

  if (lastWordCount > 5) return lines;
  if (lastToken === titleToken || titleToken.endsWith(lastToken) || lastToken.endsWith(titleToken)) {
    return lines.slice(0, -1);
  }

  return lines;
}

function removeTrailingTitleSentence(line: string, title: string): string {
  const titleToken = normalizeTitleToken(title);
  if (!titleToken) return line;

  const sentences = line.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()).filter(Boolean) ?? [line];
  if (sentences.length < 2) return line;

  const lastSentence = sentences[sentences.length - 1];
  const lastToken = normalizeTitleToken(lastSentence);
  const lastWordCount = lastToken.split(' ').filter(Boolean).length;

  if (lastWordCount <= 5 && (lastToken === titleToken || titleToken.endsWith(lastToken) || lastToken.endsWith(titleToken))) {
    return sentences.slice(0, -1).join(' ').trim();
  }

  return line;
}

function formatPlainDreamContent(content: string, title: string): string {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .trim();

  if (!normalized) return '';
  if (/<(p|h[1-6]|ul|ol|blockquote|strong|b)\b/i.test(normalized)) {
    return sanitizeHtml(normalized);
  }

  const lines = removeTrailingTitleRepeat(normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean), title);

  const sections = lines.flatMap(splitInlineHeadings);

  const html = sections.map((section) => {
    const line = removeTrailingTitleSentence(section, title);
    if (!line) return '';
    const clean = escapeHtml(line.replace(/[:：]$/, ''));
    if (looksLikeHeading(line)) {
      return `<h3>${clean}</h3>`;
    }
    const headingMatch = clean.match(/^((?:Rüyada|Rüya|Boğa|Yılan|Kara|Siyah|Beyaz|Yeşil|Sarı|Kırmızı)[^.!?]{3,70}?görmek)(?:\s*[:,]?\s*)?(.*)$/i);
    if (headingMatch?.[1]) {
      const heading = headingMatch[1].trim();
      const paragraph = headingMatch[2]?.trim();
      return [`<h3>${heading}</h3>`, paragraph ? `<p>${paragraph}</p>` : ''].filter(Boolean).join('\n');
    }
    return `<p>${clean}</p>`;
  }).filter(Boolean).join('\n');

  return sanitizeHtml(html);
}

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0%' }}
      className="fixed top-0 left-0 right-0 h-1 z-50 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600"
    />
  );
}

function ShareButton({ title, description, url }: { title: string; description: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const result = await nativeShare({ title, text: description, url });
    if (result === 'copied' || result === 'shared') {
      setCopied(true);
      toast.success('Link kopyalandı');
      haptic('light');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="rounded-xl h-10"
      title="Linki kopyala"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
      <span className="hidden sm:inline ml-2">{copied ? 'Kopyalandı' : 'Paylaş'}</span>
    </Button>
  );
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
  const { user } = useAuth();

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

      setComments(commentsWithProfiles as (Comment & { profiles?: Profile })[]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const fetchDream = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: dreamData, error } = await supabase
        .from('dreams')
        .select('*, categories(*)')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      if (slug !== latestSlugRef.current) return;
      if (!dreamData) {
        setDream(null);
        return;
      }

      setDream(dreamData as Dream);

      await supabase.rpc('increment_view_count', { dream_id: dreamData.id });
      if (slug !== latestSlugRef.current) return;
      // Optimistik view_count +1 (RPC basarili olursa DB zaten +1, UI senkron kalsin).
      setDream((prev) => (prev ? { ...prev, view_count: (prev.view_count || 0) + 1 } : prev));

      if (user) {
        await supabase.from('view_history').insert({
          user_id: user.id,
          dream_id: dreamData.id,
        });

        const { data: favData } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('dream_id', dreamData.id)
          .maybeSingle();
        setIsFavorite(!!favData);

        const { data: likeData } = await supabase
          .from('dream_likes')
          .select('id')
          .eq('user_id', user.id)
          .eq('dream_id', dreamData.id)
          .maybeSingle();
        setIsLiked(!!likeData);
      }

      await fetchComments(dreamData.id);

    } catch (error) {
      console.error('Error fetching dream:', error);
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

    const plainContent = dream.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const content = `${dream.title}\n\n${plainContent}`.slice(0, 5000);

    try {
      const { error } = await supabase.from('dream_journal').insert({
        user_id: user.id,
        title: dream.title,
        content,
        dream_date: new Date().toISOString().split('T')[0],
        tags: dream.keywords || [],
      });
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
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > 60) return; // mostly vertical
      if (dx > 80) {
        toggleFavorite();
      } else if (dx < -80) {
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

  const category = dream.category as Category;
  const heroGradient = pickGradient(dream.id + dream.slug);
  const formattedDate = new Date(dream.created_at).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const wordCount = dream.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const formattedContent = formatPlainDreamContent(dream.content, dream.title);
  const dreamPath = `/ruya/${dream.slug}`;
  const dreamDescription = dream.meta_description || dream.excerpt || `${dream.title} rüya tabiri ve yorumu`;
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
      <section className="relative overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 bg-gradient-to-br ${heroGradient}`} />
        <div className={`absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-3xl opacity-15 bg-gradient-to-br ${heroGradient}`} />

        <div className="container relative pt-8 pb-10 md:pt-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button variant="ghost" size="sm" asChild className="mb-6 rounded-xl hover:bg-muted/50">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ana Sayfa
              </Link>
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br ${heroGradient} flex items-center justify-center shadow-2xl shadow-primary/20 shrink-0`}
            >
              <Sparkles className="w-10 h-10 md:w-14 md:h-14 text-white" />
            </motion.div>

            <div className="flex-1 min-w-0">
              {category && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    to={`/kategori/${category.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary hover:bg-primary/15 transition-colors border border-primary/20 mb-4"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    {category.name}
                    <ChevronRight className="w-3 h-3 opacity-60" />
                  </Link>
                </motion.div>
              )}

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-3xl md:text-4xl lg:text-5xl font-serif-dream font-bold leading-tight tracking-tight mb-5"
              >
                <span className={`bg-gradient-to-br ${heroGradient} bg-clip-text text-transparent`}>
                  {dream.title}
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span className="font-semibold text-foreground">{(dream.view_count || 0).toLocaleString('tr-TR')}</span> görüntülenme
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  <span className="font-semibold text-foreground">{(dream.like_count || 0).toLocaleString('tr-TR')}</span> beğeni
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {readTime} dakika okuma
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

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
              <TextSizeControls value={textSize} onChange={setTextSize} />
            </div>
            <div
              className={`dream-content prose ${textSizeClasses[textSize]} dark:prose-invert max-w-none prose-headings:font-serif-dream prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-primary/90 prose-p:leading-[1.9] prose-p:text-foreground/85 prose-p:mb-5 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80 prose-strong:text-foreground prose-img:rounded-xl`}
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </ContentCard>
        </motion.div>
      </section>

      {/* Keywords */}
      {dream.keywords && dream.keywords.length > 0 && (
        <section className="container pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl mx-auto surface p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center">
                <Tag className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">İlgili Anahtar Kelimeler</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {dream.keywords.map((keyword) => (
                <Link
                  key={keyword}
                  to={`/ara?q=${encodeURIComponent(keyword)}`}
                  className="group px-3.5 py-1.5 text-sm rounded-full bg-muted/60 hover:bg-gradient-to-r hover:from-violet-500 hover:to-fuchsia-500 hover:text-white transition-all duration-200 border border-border/60 hover:border-transparent"
                >
                  <span className="mr-1.5 opacity-60 group-hover:opacity-100">#</span>
                  {keyword}
                </Link>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      <section className="container pb-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-background p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-serif-dream text-xl font-bold">Bu rüyayla devam edin</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tabiri günlüğünüze ekleyin veya kendi rüyanızı AI ile yorumlatın.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={saveToJournal} className="rounded-xl">
                <PenLine className="mr-2 h-4 w-4" />
                Günlüğüme Kaydet
              </Button>
              <Button asChild className="rounded-xl dream-gradient">
                <Link to={`/ruya-yorumlat?q=${encodeURIComponent(dream.title)}`}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Rüyamı Yorumlat
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <section className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-3xl mx-auto surface p-3 flex flex-wrap items-center gap-2"
        >
          <Button
            variant={isLiked ? 'default' : 'outline'}
            size="sm"
            onClick={animatedToggleLike}
            className={`rounded-xl h-10 transition-all duration-200 ${
              isLiked
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0'
                : 'hover:border-rose-500/50 hover:bg-rose-500/5 hover:text-rose-600'
            } ${likeAnimation ? 'scale-110' : 'scale-100'}`}
          >
            <Heart className={`mr-2 h-4 w-4 transition-transform ${isLiked ? 'fill-current' : ''} ${likeAnimation ? 'scale-125' : ''}`} />
            {isLiked ? 'Beğenildi' : 'Beğen'}
            {(dream.like_count || 0) > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full font-semibold ${isLiked ? 'bg-white/20' : 'bg-muted'}`}>
                {dream.like_count}
              </span>
            )}
          </Button>

          <Button
            variant={isFavorite ? 'default' : 'outline'}
            size="sm"
            onClick={animatedToggleFavorite}
            className={`rounded-xl h-10 transition-all duration-200 ${
              isFavorite
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0'
                : 'hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600'
            } ${favoriteAnimation ? 'scale-110' : 'scale-100'}`}
          >
            <Bookmark className={`mr-2 h-4 w-4 transition-transform ${isFavorite ? 'fill-current' : ''} ${favoriteAnimation ? 'scale-125' : ''}`} />
            {isFavorite ? 'Kaydedildi' : 'Kaydet'}
          </Button>

          <div className="ml-auto">
            <ShareButton
              title={dream.title}
              description={dream.content.slice(0, 160)}
              url={shareUrl}
            />
          </div>
        </motion.div>
      </section>

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
            description={dream.content.slice(0, 160)}
          />
        </motion.div>
      </section>

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
            keywords={dream.keywords || []}
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

function ContentCard({
  icon: Icon,
  gradient,
  title,
  children,
}: {
  icon: typeof BookOpen;
  gradient: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface p-6 md:p-10 relative overflow-hidden"
    >
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${gradient}`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/60">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-serif-dream font-bold">{title}</h2>
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="surface p-10 text-center"
    >
      <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-5`}>
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-lg font-serif-dream font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
    </motion.div>
  );
}
