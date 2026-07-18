import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { notify } from '@/lib/notify';
import { t } from '@/constants/translations';
import { captureError } from '@/lib/logger';
import type { Dream, ViewHistory } from '@/types/database';

interface ProfileHistoryTabProps {
  userId: string;
  locale: string;
}

export function ProfileHistoryTab({ userId, locale }: ProfileHistoryTabProps) {
  const [history, setHistory] = useState<(ViewHistory & { dreams: Dream })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('view_history')
        .select('*, dreams(*)')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const uniqueHistory = (data as unknown as (ViewHistory & { dreams: Dream })[] | null)?.reduce((acc, curr) => {
        const exists = acc.find(h => h.dream_id === curr.dream_id);
        if (!exists) acc.push(curr);
        return acc;
      }, [] as (ViewHistory & { dreams: Dream })[]) || [];

      setHistory(uniqueHistory);
    } catch (error) {
      captureError(error, { tags: { feature: 'profile-history' } });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearHistory = async () => {
    if (!confirm(t('profile.historyClearConfirm'))) return;
    try {
      const { error } = await supabase.from('view_history').delete().eq('user_id', userId);
      if (error) throw error;
      notify.success(t('profile.historyCleared'));
      setHistory([]);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  const removeHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase.from('view_history').delete().eq('id', id);
      if (error) throw error;
      setHistory(history.filter(h => h.id !== id));
    } catch (error) {
      notify.error(error instanceof Error ? error.message : t('favorites.error'));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif-dream font-bold">{t('profile.historyTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('profile.historyDesc')}</p>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory} className="rounded-xl hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30">
            <Trash2 className="mr-2 h-4 w-4" />{t('profile.clearAllHistory')}
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 surface rounded-xl animate-pulse" />)}
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="group flex items-center gap-3 p-4 surface hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <Link to={`/ruya/${item.dreams.slug}`} className="flex-1 min-w-0">
                <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                  {item.dreams.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>
                    {new Date(item.viewed_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {(item.dreams.view_count || 0).toLocaleString(locale)}
                  </span>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeHistoryItem(item.id)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Geçmişten kaldır"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 surface rounded-3xl"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-5">
            <Clock className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-serif-dream font-bold mb-2">{t('profile.noHistory')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('profile.noHistoryDesc')}
          </p>
          <Button asChild className="rounded-xl h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <Link to="/">{t('profile.browseDreams')}</Link>
          </Button>
        </motion.div>
      )}
    </>
  );
}
