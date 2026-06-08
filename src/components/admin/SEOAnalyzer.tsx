// @ts-nocheck
import { useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface SEOAnalyzerProps {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  keywords?: string[];
  slug?: string;
}

interface SEOCheck {
  id: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  score: number;
  maxScore: number;
}

export function SEOAnalyzer({
  title,
  metaTitle,
  metaDescription,
  content,
  keywords = [],
  slug,
}: SEOAnalyzerProps) {
  const checks = useMemo(() => {
    const results: SEOCheck[] = [];
    const plainContent = content.replace(/<[^>]*>/g, '').trim();
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    const effectiveTitle = metaTitle || title;

    // Title length check (50-60 chars ideal)
    const titleLength = effectiveTitle.length;
    if (titleLength === 0) {
      results.push({
        id: 'title-length',
        name: 'Başlık Uzunluğu',
        status: 'fail',
        message: 'Başlık girilmedi',
        score: 0,
        maxScore: 15,
      });
    } else if (titleLength >= 50 && titleLength <= 60) {
      results.push({
        id: 'title-length',
        name: 'Başlık Uzunluğu',
        status: 'pass',
        message: `Mükemmel! ${titleLength} karakter (50-60 ideal)`,
        score: 15,
        maxScore: 15,
      });
    } else if (titleLength >= 30 && titleLength < 50) {
      results.push({
        id: 'title-length',
        name: 'Başlık Uzunluğu',
        status: 'warning',
        message: `${titleLength} karakter - biraz kısa (50-60 ideal)`,
        score: 10,
        maxScore: 15,
      });
    } else if (titleLength > 60 && titleLength <= 70) {
      results.push({
        id: 'title-length',
        name: 'Başlık Uzunluğu',
        status: 'warning',
        message: `${titleLength} karakter - biraz uzun (50-60 ideal)`,
        score: 10,
        maxScore: 15,
      });
    } else {
      results.push({
        id: 'title-length',
        name: 'Başlık Uzunluğu',
        status: 'fail',
        message: `${titleLength} karakter - ${titleLength < 30 ? 'çok kısa' : 'çok uzun'} (50-60 ideal)`,
        score: 5,
        maxScore: 15,
      });
    }

    // Meta description check (120-160 chars ideal)
    const descLength = metaDescription?.length || 0;
    if (descLength === 0) {
      results.push({
        id: 'meta-desc',
        name: 'Meta Açıklama',
        status: 'fail',
        message: 'Meta açıklama girilmedi',
        score: 0,
        maxScore: 15,
      });
    } else if (descLength >= 120 && descLength <= 160) {
      results.push({
        id: 'meta-desc',
        name: 'Meta Açıklama',
        status: 'pass',
        message: `Mükemmel! ${descLength} karakter (120-160 ideal)`,
        score: 15,
        maxScore: 15,
      });
    } else if (descLength >= 80 && descLength < 120) {
      results.push({
        id: 'meta-desc',
        name: 'Meta Açıklama',
        status: 'warning',
        message: `${descLength} karakter - biraz kısa (120-160 ideal)`,
        score: 10,
        maxScore: 15,
      });
    } else if (descLength > 160 && descLength <= 200) {
      results.push({
        id: 'meta-desc',
        name: 'Meta Açıklama',
        status: 'warning',
        message: `${descLength} karakter - biraz uzun, kesilebilir`,
        score: 10,
        maxScore: 15,
      });
    } else {
      results.push({
        id: 'meta-desc',
        name: 'Meta Açıklama',
        status: 'fail',
        message: `${descLength} karakter - ${descLength < 80 ? 'çok kısa' : 'çok uzun'}`,
        score: 5,
        maxScore: 15,
      });
    }

    // Content length check (min 300 words recommended)
    if (wordCount >= 1000) {
      results.push({
        id: 'content-length',
        name: 'İçerik Uzunluğu',
        status: 'pass',
        message: `Harika! ${wordCount} kelime - detaylı içerik`,
        score: 20,
        maxScore: 20,
      });
    } else if (wordCount >= 500) {
      results.push({
        id: 'content-length',
        name: 'İçerik Uzunluğu',
        status: 'pass',
        message: `İyi! ${wordCount} kelime`,
        score: 15,
        maxScore: 20,
      });
    } else if (wordCount >= 300) {
      results.push({
        id: 'content-length',
        name: 'İçerik Uzunluğu',
        status: 'warning',
        message: `${wordCount} kelime - daha fazla içerik ekleyin (500+ önerilir)`,
        score: 10,
        maxScore: 20,
      });
    } else {
      results.push({
        id: 'content-length',
        name: 'İçerik Uzunluğu',
        status: 'fail',
        message: `${wordCount} kelime - çok kısa (min 300 kelime)`,
        score: 5,
        maxScore: 20,
      });
    }

    // Keywords check
    if (keywords.length === 0) {
      results.push({
        id: 'keywords',
        name: 'Anahtar Kelimeler',
        status: 'fail',
        message: 'Anahtar kelime/etiket eklenmedi',
        score: 0,
        maxScore: 15,
      });
    } else if (keywords.length >= 3 && keywords.length <= 7) {
      results.push({
        id: 'keywords',
        name: 'Anahtar Kelimeler',
        status: 'pass',
        message: `${keywords.length} anahtar kelime - ideal sayı`,
        score: 15,
        maxScore: 15,
      });
    } else if (keywords.length >= 1 && keywords.length < 3) {
      results.push({
        id: 'keywords',
        name: 'Anahtar Kelimeler',
        status: 'warning',
        message: `${keywords.length} anahtar kelime - daha fazla ekleyin (3-7 ideal)`,
        score: 10,
        maxScore: 15,
      });
    } else {
      results.push({
        id: 'keywords',
        name: 'Anahtar Kelimeler',
        status: 'warning',
        message: `${keywords.length} anahtar kelime - çok fazla olabilir`,
        score: 10,
        maxScore: 15,
      });
    }

    // URL/Slug check
    if (!slug || slug.length === 0) {
      results.push({
        id: 'slug',
        name: 'URL Yapısı',
        status: 'fail',
        message: 'URL slug girilmedi',
        score: 0,
        maxScore: 10,
      });
    } else if (slug.length <= 50 && !slug.includes('--') && /^[a-z0-9-]+$/.test(slug)) {
      results.push({
        id: 'slug',
        name: 'URL Yapısı',
        status: 'pass',
        message: 'SEO dostu URL',
        score: 10,
        maxScore: 10,
      });
    } else {
      results.push({
        id: 'slug',
        name: 'URL Yapısı',
        status: 'warning',
        message: 'URL optimize edilebilir (kısa, tire ile ayrılmış)',
        score: 5,
        maxScore: 10,
      });
    }

    // Heading check (H2, H3 usage in content)
    const hasH2 = /<h2/i.test(content);
    const hasH3 = /<h3/i.test(content);
    if (hasH2 && hasH3) {
      results.push({
        id: 'headings',
        name: 'Başlık Hiyerarşisi',
        status: 'pass',
        message: 'H2 ve H3 başlıklar kullanılmış',
        score: 10,
        maxScore: 10,
      });
    } else if (hasH2 || hasH3) {
      results.push({
        id: 'headings',
        name: 'Başlık Hiyerarşisi',
        status: 'warning',
        message: 'Alt başlıklar eklenebilir (H2, H3)',
        score: 5,
        maxScore: 10,
      });
    } else {
      results.push({
        id: 'headings',
        name: 'Başlık Hiyerarşisi',
        status: 'fail',
        message: 'İçerikte alt başlık yok - yapılandırın',
        score: 0,
        maxScore: 10,
      });
    }

    // Image alt text check
    const images = content.match(/<img[^>]*>/gi) || [];
    const imagesWithAlt = images.filter(img => /alt=["'][^"']+["']/i.test(img));
    if (images.length === 0) {
      results.push({
        id: 'images',
        name: 'Görsel Kullanımı',
        status: 'warning',
        message: 'İçerikte görsel yok - görsel eklemeyi düşünün',
        score: 5,
        maxScore: 10,
      });
    } else if (imagesWithAlt.length === images.length) {
      results.push({
        id: 'images',
        name: 'Görsel Alt Metinleri',
        status: 'pass',
        message: `Tüm görsellerde alt metin var (${images.length} görsel)`,
        score: 10,
        maxScore: 10,
      });
    } else {
      results.push({
        id: 'images',
        name: 'Görsel Alt Metinleri',
        status: 'fail',
        message: `${images.length - imagesWithAlt.length}/${images.length} görselde alt metin eksik`,
        score: 3,
        maxScore: 10,
      });
    }

    // Internal links check
    const internalLinks = (content.match(/href=["'][^"']*["']/gi) || []).filter(
      link => !link.includes('http://') && !link.includes('https://')
    );
    if (internalLinks.length >= 2) {
      results.push({
        id: 'internal-links',
        name: 'İç Bağlantılar',
        status: 'pass',
        message: `${internalLinks.length} iç bağlantı - iyi`,
        score: 5,
        maxScore: 5,
      });
    } else if (internalLinks.length === 1) {
      results.push({
        id: 'internal-links',
        name: 'İç Bağlantılar',
        status: 'warning',
        message: 'Daha fazla iç bağlantı ekleyin',
        score: 3,
        maxScore: 5,
      });
    } else {
      results.push({
        id: 'internal-links',
        name: 'İç Bağlantılar',
        status: 'warning',
        message: 'İç bağlantı yok - site içi linkleme önerilir',
        score: 0,
        maxScore: 5,
      });
    }

    return results;
  }, [title, metaTitle, metaDescription, content, keywords, slug]);

  const totalScore = checks.reduce((acc, check) => acc + check.score, 0);
  const maxScore = checks.reduce((acc, check) => acc + check.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = () => {
    if (percentage >= 80) return 'bg-emerald-500';
    if (percentage >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = () => {
    if (percentage >= 80) return 'Mükemmel';
    if (percentage >= 60) return 'İyi';
    if (percentage >= 40) return 'Orta';
    return 'Zayıf';
  };

  const StatusIcon = ({ status }: { status: 'pass' | 'warning' | 'fail' }) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;

  return (
    <Collapsible>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <span className="font-medium">SEO Analizi</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 gap-1">
                <CheckCircle className="h-3 w-3" /> {passCount}
              </Badge>
              <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
                <AlertCircle className="h-3 w-3" /> {warningCount}
              </Badge>
              <Badge variant="outline" className="border-red-500 text-red-600 gap-1">
                <XCircle className="h-3 w-3" /> {failCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24">
                <Progress value={percentage} className="h-2" />
              </div>
              <span className={cn("font-bold text-lg", getScoreColor())}>
                {percentage}
              </span>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 p-4 border rounded-lg space-y-4">
          {/* Score Summary */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h4 className="font-semibold text-lg">SEO Skoru</h4>
              <p className="text-sm text-muted-foreground">
                {getScoreLabel()} - {checks.length} kriter analiz edildi
              </p>
            </div>
            <div className="text-right">
              <div className={cn("text-4xl font-bold", getScoreColor())}>
                {percentage}<span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
          </div>

          {/* Checks List */}
          <div className="space-y-2">
            {checks.map((check) => (
              <div
                key={check.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  check.status === 'pass' && "bg-emerald-50 dark:bg-emerald-950/20",
                  check.status === 'warning' && "bg-amber-50 dark:bg-amber-950/20",
                  check.status === 'fail' && "bg-red-50 dark:bg-red-950/20"
                )}
              >
                <div className="flex items-center gap-3">
                  <StatusIcon status={check.status} />
                  <div>
                    <p className="font-medium text-sm">{check.name}</p>
                    <p className="text-xs text-muted-foreground">{check.message}</p>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {check.score}/{check.maxScore}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {(warningCount > 0 || failCount > 0) && (
            <div className="pt-4 border-t">
              <h5 className="font-medium text-sm mb-2">💡 Öneriler</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                {checks
                  .filter(c => c.status !== 'pass')
                  .slice(0, 3)
                  .map(check => (
                    <li key={check.id} className="flex items-start gap-2">
                      <span className="text-indigo-500">•</span>
                      <span>{check.name}: {check.message}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
