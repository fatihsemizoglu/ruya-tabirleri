import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class TrendingService {
  async getWeeklyTrending(limit = 10) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: dreams } = await supabase
      .from('dreams')
      .select('keywords, view_count, like_count, created_at')
      .eq('is_published', true)
      .gte('created_at', weekAgo.toISOString());

    if (!dreams) return [];

    const keywordMap: Record<string, { count: number; views: number; likes: number }> = {};
    dreams.forEach((d: any) => {
      const keywords = Array.isArray(d.keywords) ? d.keywords : [];
      keywords.forEach((k: string) => {
        if (!keywordMap[k]) keywordMap[k] = { count: 0, views: 0, likes: 0 };
        keywordMap[k].count++;
        keywordMap[k].views += d.view_count || 0;
        keywordMap[k].likes += d.like_count || 0;
      });
    });

    return Object.entries(keywordMap)
      .map(([keyword, stats]) => ({
        keyword,
        ...stats,
        score: stats.count * 2 + stats.views * 0.1 + stats.likes * 0.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getMonthlyTrending(limit = 10) {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: dreams } = await supabase
      .from('dreams')
      .select('keywords, view_count, like_count')
      .eq('is_published', true)
      .gte('created_at', monthAgo.toISOString());

    if (!dreams) return [];

    const keywordMap: Record<string, { count: number; views: number; likes: number }> = {};
    dreams.forEach((d: any) => {
      const keywords = Array.isArray(d.keywords) ? d.keywords : [];
      keywords.forEach((k: string) => {
        if (!keywordMap[k]) keywordMap[k] = { count: 0, views: 0, likes: 0 };
        keywordMap[k].count++;
        keywordMap[k].views += d.view_count || 0;
        keywordMap[k].likes += d.like_count || 0;
      });
    });

    return Object.entries(keywordMap)
      .map(([keyword, stats]) => ({
        keyword,
        ...stats,
        score: stats.count * 2 + stats.views * 0.1 + stats.likes * 0.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

export const trendingService = new TrendingService();
