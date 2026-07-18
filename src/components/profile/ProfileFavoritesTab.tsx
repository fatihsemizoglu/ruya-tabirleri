import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { notify } from '@/lib/notify';
import { t } from '@/constants/translations';
import { captureError } from '@/lib/logger';
import type { Dream, Favorite } from '@/types/database';

interface ProfileFavoritesTabProps {
  userId: string;
  locale: string;
}

export function ProfileFavoritesTab({ userId, locale }: ProfileFavoritesTabProps) {
  const [favorites, setFavorites] = useState<(Favorite & { dreams: Dream })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*, dreams(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites((data as (Favorite & { dreams: Dream })[]) || []);
    } catch (error) {
      captureError(error, { tags: { feature: 'profile-favorites' } });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (id: string) => {
    try {
      const { error } = await supabase.from('favorites').delete().eq('id', id);
      if (error) throw error;
      notify.success(t('profile.favoriteRemoved'));
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-serif-dream font-bold">{t('profile.favoritesTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('profile.favoritesDesc')}</p>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 surface rounded-2xl animate-pulse" />)}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {favorites.map((fav) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative surface p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
              <Link to={`/ruya/${fav.dreams.slug}`} className="block">
                <h3 className="text-lg font-serif-dream font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {fav.dreams.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{fav.dreams.content}</p>
              </Link>
              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {(fav.dreams.view_count || 0).toLocaleString(locale)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    {(fav.dreams.like_count || 0).toLocaleString(locale)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFavorite(fav.id)}
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                  aria-label="Favorilerden kaldır"
                  title={t('profile.favoriteRemoveConfirm')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 surface rounded-3xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-5">
            <Heart className="h-10 w-10 text-rose-500" />
          </div>
          <h3 className="text-xl font-serif-dream font-bold mb-2">{t('profile.noFavoritesInTab')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('profile.noFavoritesInTabDesc')}
          </p>
          <Button asChild className="rounded-xl h-11 bg-gradient-to-r from-rose-600 to-pink-600 text-white">
            <Link to="/">{t('profile.browseDreams')}</Link>
          </Button>
        </motion.div>
      )}
    </>
  );
}
