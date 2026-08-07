import { motion } from 'framer-motion';
import { Heart, Bookmark, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/dream/ShareButton';
import type { Dream } from '@/types/database';

interface DreamActionBarProps {
  dream: Dream;
  isLiked: boolean;
  isFavorite: boolean;
  likeAnimation: boolean;
  favoriteAnimation: boolean;
  onToggleLike: () => void;
  onToggleFavorite: () => void;
  onAddToCompare: () => void;
  isInCompare: boolean;
  shareUrl: string;
}

export function DreamActionBar({
  dream,
  isLiked,
  isFavorite,
  likeAnimation,
  favoriteAnimation,
  onToggleLike,
  onToggleFavorite,
  onAddToCompare,
  isInCompare,
  shareUrl,
}: DreamActionBarProps) {
  return (
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
          onClick={onToggleLike}
          className={`rounded-xl transition-all duration-200 ${
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
          onClick={onToggleFavorite}
          className={`rounded-xl transition-all duration-200 ${
            isFavorite
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0'
              : 'hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-600'
          } ${favoriteAnimation ? 'scale-110' : 'scale-100'}`}
        >
          <Bookmark className={`mr-2 h-4 w-4 transition-transform ${isFavorite ? 'fill-current' : ''} ${favoriteAnimation ? 'scale-125' : ''}`} />
          {isFavorite ? 'Kaydedildi' : 'Kaydet'}
        </Button>

        <Button variant={isInCompare ? 'secondary' : 'outline'} size="sm" onClick={onAddToCompare} className="rounded-xl">
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {isInCompare ? 'Listede' : 'Karşılaştır'}
        </Button>

        <div className="ml-auto">
          <ShareButton
            title={dream.title}
            description={(dream.content || '').slice(0, 160)}
            url={shareUrl}
          />
        </div>
      </motion.div>
    </section>
  );
}
