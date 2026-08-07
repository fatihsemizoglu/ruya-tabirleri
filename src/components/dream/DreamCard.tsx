import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Star, Eye, Heart, Trash2, Check, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { dreamCardVariants } from '@/lib/dream-card';
import type { ViewMode } from '@/lib/dream-card';
import type { Dream, Category } from '@/types/database';

interface DreamCardProps {
  dream: Dream;
  viewMode: ViewMode;
  /** Kompakt: Popüler sayfasının rank-listesi kartı; zengin: Kategori/Favoriler kartı. */
  variant?: 'compact' | 'rich';
  /** Sıralama indeksi (animasyon gecikmesi + rank rozeti). */
  index?: number;
  /** Zengin kartta üst bar + ikon kutusu gradient'i. */
  gradient?: string;
  /** Zengin kartta kategori rozeti (Favoriler). */
  category?: Category | null;
  /** Zengin kartta ikon kutusu içeriği. */
  icon?: 'sparkles' | 'heart';
  /** Zengin kartta animasyon: stagger (container orkestrasyonu) veya inview. */
  animation?: 'stagger' | 'inview';
  /** Kompakt kartta sıralama (top-3) rozeti — yalnızca trend sekmesinde. */
  isRanked?: boolean;
  /** Zengin kartta "Öne Çıkan" rozeti (Kategori sayfası). */
  showFeatured?: boolean;
  /** Zengin kartta kategori rozeti göster (Favoriler). */
  showCategoryBadge?: boolean;
  /** Zengin liste kartında ilk anahtar kelime rozeti (Kategori sayfası). */
  showFirstKeyword?: boolean;
  /** Favoriler seçim modu. */
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** Favorilerden kaldırma butonu. */
  onDelete?: (id: string) => void;
  /** Zengin kartta footer tarihi (Favoriler). */
  footerDate?: string;
}

export function DreamCard({
  dream,
  viewMode,
  variant = 'rich',
  index = 0,
  gradient = 'from-violet-500 to-fuchsia-500',
  category = null,
  icon = 'sparkles',
  animation = 'stagger',
  isRanked = false,
  showFeatured = false,
  showCategoryBadge = false,
  showFirstKeyword = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onDelete,
  footerDate,
}: DreamCardProps) {
  const isTopThree = isRanked && index < 3;
  const rankGradient = isTopThree
    ? index === 0
      ? 'from-amber-400 to-yellow-500'
      : index === 1
        ? 'from-slate-300 to-slate-400'
        : 'from-orange-400 to-amber-600'
    : 'from-primary/50 to-primary';
  const Icon = icon === 'heart' ? Heart : Sparkles;

  /* ── Kompakt (Popüler sayfası) ─────────────────────────────── */
  if (variant === 'compact') {
    if (viewMode === 'list') {
      return (
        <motion.div variants={dreamCardVariants} custom={index}>
          <Link
            to={`/ruya/${dream.slug}`}
            className="group flex min-h-11 items-center gap-2.5 border-b border-border/20 px-1 py-2 hover:bg-accent/20 transition-colors"
          >
            <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-semibold ${
              isTopThree
                ? `bg-gradient-to-br ${rankGradient} text-white`
                : 'text-muted-foreground/40'
            }`}>
              {index + 1}
            </span>
            <h3 className="flex-1 min-w-0 text-[12px] font-medium text-foreground/85 group-hover:text-primary truncate transition-colors">
              {dream.title}
            </h3>
            {category && (
              <span className="hidden sm:block text-[10px] text-muted-foreground/50 shrink-0">
                {category.name}
              </span>
            )}
            {dream.is_featured && (
              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0" />
            )}
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.div variants={dreamCardVariants} custom={index}>
        <Link
          to={`/ruya/${dream.slug}`}
          className="group relative block min-h-11 bg-card border border-border/40 rounded-lg p-2.5 hover:border-primary/20 hover:bg-accent/30 transition-all duration-200"
        >
          <div className="flex items-start gap-2">
            <div
              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-semibold ${
                isTopThree
                  ? `bg-gradient-to-br ${rankGradient} text-white`
                  : 'bg-muted text-muted-foreground/60'
              }`}
            >
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[11px] font-medium text-foreground/90 group-hover:text-primary leading-snug line-clamp-1 transition-colors">
                {dream.title}
              </h3>
              {category && (
                <span className="text-[9px] text-muted-foreground/50 mt-0.5 block truncate">
                  {category.name}
                </span>
              )}
            </div>
            {dream.is_featured && (
              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
            )}
          </div>
        </Link>
      </motion.div>
    );
  }

  /* ── Zengin (Kategori + Favoriler) ─────────────────────────── */
  const body = viewMode === 'list' ? (
    <div
      className={`group relative flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 ${
        isSelectionMode && isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Top gradient bar (list) */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-t-2xl`} />

      {isSelectionMode && onToggleSelect && (
        <button
          type="button"
          onClick={() => onToggleSelect(dream.id)}
          className={`shrink-0 -m-2.5 flex h-11 w-11 items-center justify-center rounded-full border-2 transition-colors ${
            isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50 bg-background hover:border-primary'
          }`}
          aria-label={isSelected ? 'Seçimi kaldır' : 'Seç'}
        >
          {isSelected && <Check className="h-4 w-4" />}
        </button>
      )}

      {/* Icon tile */}
      <div className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5 text-white fill-current" />
      </div>

      <Link
        to={`/ruya/${dream.slug}`}
        className={`flex-1 min-w-0 ${isSelectionMode ? 'pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          {showFeatured && dream.is_featured && (
            <Badge variant="secondary" className="rounded-full text-xs gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              Öne Çıkan
            </Badge>
          )}
          {showCategoryBadge && category && (
            <Badge variant="secondary" className="text-xs gap-1">
              <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
            </Badge>
          )}
          {showFirstKeyword && dream.keywords && dream.keywords.length > 0 && (
            <Badge variant="outline" className="rounded-full text-xs">
              {dream.keywords[0]}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {dream.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
          {dream.content}
        </p>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-sm text-muted-foreground">
        <div className="hidden sm:flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          <span className="font-medium text-xs">
            {(dream.view_count || 0).toLocaleString('tr-TR')}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          <span className="font-medium text-xs">
            {(dream.like_count || 0).toLocaleString('tr-TR')}
          </span>
        </div>
        <Link
          to={`/ruya/${dream.slug}`}
          className={`-m-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity ${isSelectionMode ? 'hidden' : ''}`}
          onClick={(e) => e.stopPropagation()}
          aria-label="Rüyayı görüntüle"
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
        </Link>
        {!isSelectionMode && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dream.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Favorilerden kaldır"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  ) : (
    <div
      className={`group relative h-full bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500 ${
        isSelectionMode && isSelected ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

      {/* Hover shine */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none z-10" />

      {/* Selection checkbox (overlay) */}
      {isSelectionMode && onToggleSelect && (
        <button
          type="button"
          onClick={() => onToggleSelect(dream.id)}
          className={`absolute top-3 left-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
            isSelected
              ? 'bg-primary border-primary text-primary-foreground scale-110'
              : 'border-muted-foreground/50 bg-background/90 backdrop-blur-sm hover:border-primary'
          }`}
          aria-label={isSelected ? 'Seçimi kaldır' : 'Seç'}
        >
          {isSelected && <Check className="h-4 w-4" />}
        </button>
      )}

      {/* Delete button (overlay) */}
      {!isSelectionMode && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(dream.id);
          }}
          className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 bg-background/80 backdrop-blur-sm"
          aria-label="Favorilerden kaldır"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}

      <Link
        to={`/ruya/${dream.slug}`}
        className={`block h-full p-6 ${isSelectionMode ? 'pointer-events-none' : ''}`}
      >
        <div className="relative">
          {/* Top row: icon tile + badges */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5 text-white fill-current" />
              </div>
            </div>
            {showCategoryBadge && category && (
              <Badge variant="secondary" className="text-xs gap-1">
                <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
              </Badge>
            )}
            {showFeatured && dream.is_featured && (
              <Badge variant="secondary" className="rounded-full text-xs gap-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                Öne Çıkan
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold font-serif-dream text-lg text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
            {dream.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
            {dream.content}
          </p>

          {/* Keywords */}
          {dream.keywords && dream.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {dream.keywords.slice(0, 3).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted/70 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          )}

          {/* Footer stats */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-semibold">{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                <span className="font-semibold">{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {footerDate && (
                <span className="text-xs text-muted-foreground/70">{footerDate}</span>
              )}
              <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );

  if (animation === 'stagger') {
    return <motion.div variants={dreamCardVariants} custom={index}>{body}</motion.div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: viewMode === 'list' ? 10 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: viewMode === 'list' ? 0.3 : 0.4, delay: index * (viewMode === 'list' ? 0.02 : 0.03) }}
    >
      {body}
    </motion.div>
  );
}
