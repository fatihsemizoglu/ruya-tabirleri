import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class FullTextSearchService {
  async search(query: string, options: {
    page?: number;
    limit?: number;
    category_id?: string;
    type?: 'dreams' | 'blog' | 'all';
  } = {}) {
    const { page = 1, limit = 20, category_id, type = 'all' } = options;
    const offset = (page - 1) * limit;
    const results: any[] = [];

    if (type === 'dreams' || type === 'all') {
      let dreamQuery = supabase
        .from('dreams')
        .select('id, title, slug, content, keywords, category_id, view_count, like_count, categories(name, slug)')
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,keywords.cs.{${query}}`)
        .order('view_count', { ascending: false })
        .limit(type === 'all' ? Math.ceil(limit / 2) : limit)
        .range(offset, offset + (type === 'all' ? Math.ceil(limit / 2) : limit) - 1);

      if (category_id) dreamQuery = dreamQuery.eq('category_id', category_id);

      const { data: dreams } = await dreamQuery;
      (dreams || []).forEach((d: any) => results.push({ ...d, _type: 'dream' }));
    }

    if (type === 'blog' || type === 'all') {
      const { data: posts } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, content, category_id, view_count')
        .eq('is_published', true)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('view_count', { ascending: false })
        .limit(type === 'all' ? Math.ceil(limit / 2) : limit)
        .range(offset, offset + (type === 'all' ? Math.ceil(limit / 2) : limit) - 1);

      (posts || []).forEach((p: any) => results.push({ ...p, _type: 'blog' }));
    }

    results.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));

    return {
      data: results.slice(0, limit),
      total: results.length,
      query,
    };
  }

  async getSuggestions(query: string, limit = 8) {
    if (!query || query.length < 2) return [];

    const { data } = await supabase
      .from('dreams')
      .select('title, slug')
      .eq('is_published', true)
      .ilike('title', `%${query}%`)
      .order('view_count', { ascending: false })
      .limit(limit);

    return data || [];
  }

  async getPopularSearches(limit = 10) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('search_logs')
      .select('query')
      .gte('created_at', thirtyDaysAgo);

    if (!data) return [];

    const queryMap: Record<string, number> = {};
    data.forEach((log: any) => {
      const q = log.query.toLowerCase().trim();
      if (q) queryMap[q] = (queryMap[q] || 0) + 1;
    });

    return Object.entries(queryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));
  }
}

export const fullTextSearchService = new FullTextSearchService();
