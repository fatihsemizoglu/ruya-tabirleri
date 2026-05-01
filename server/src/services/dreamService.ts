import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import { v4 as uuidv4 } from 'uuid';
import type { Dream, Category } from '../types/index';

export class DreamService {
  async getDreams(filters: {
    page?: number;
    limit?: number;
    category_id?: string;
    search?: string;
    is_featured?: boolean;
    is_published?: string;
    sort_by?: string;
    sort_order?: string;
    isAdmin?: boolean;
  }) {
    const { page = 1, limit = 20, category_id, search, is_featured, is_published, sort_by, sort_order, isAdmin } = filters;
    const offset = (page - 1) * limit;

    let query = supabase.from('dreams').select('*, categories(name, slug)', { count: 'exact' });

    if (is_published !== undefined && is_published !== 'all') {
      query = query.eq('is_published', is_published === 'true');
    } else if (!isAdmin) {
      query = query.eq('is_published', true);
    }

    if (category_id) query = query.eq('category_id', category_id);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    if (is_featured !== undefined) query = query.eq('is_featured', is_featured);

    const validSortColumns = ['created_at', 'view_count', 'like_count', 'title'];
    const sortCol = validSortColumns.includes(sort_by || '') ? sort_by! : 'created_at';
    const ascending = sort_order?.toUpperCase() === 'ASC';
    query = query.order(sortCol, { ascending }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError('Failed to fetch dreams', 500);

    const dreams = (data || []).map((d: any) => ({
      ...d,
      category_name: d.categories?.name,
      category_slug: d.categories?.slug,
    }));

    return {
      data: dreams,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    };
  }

  async getFeaturedDreams(limit = 5) {
    const { data, error } = await supabase
      .from('dreams')
      .select('*, categories(name, slug)')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw new AppError('Failed to fetch featured dreams', 500);

    return (data || []).map((d: any) => ({
      ...d,
      category_name: d.categories?.name,
      category_slug: d.categories?.slug,
    }));
  }

  async getDreamBySlug(slug: string, userId?: string) {
    const { data: dream, error } = await supabase
      .from('dreams')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .single();

    if (!dream || error) throw new AppError('Dream not found', 404);

    const dreamData = dream as any;

    await Promise.all([
      supabase
        .from('dreams')
        .update({ view_count: (dreamData.view_count || 0) + 1 })
        .eq('id', dream.id),
      userId ? this.recordViewHistory(userId, dream.id) : Promise.resolve(),
    ]);

    let isLiked = false;
    let isFavorited = false;
    if (userId) {
      const [likeRes, favRes] = await Promise.all([
        supabase.from('dream_likes').select('id').eq('dream_id', dream.id).eq('user_id', userId).single(),
        supabase.from('favorites').select('id').eq('dream_id', dream.id).eq('user_id', userId).single(),
      ]);
      isLiked = !!likeRes.data;
      isFavorited = !!favRes.data;
    }

    return {
      ...dreamData,
      category_name: dreamData.categories?.name,
      category_slug: dreamData.categories?.slug,
      isLiked,
      isFavorited,
    };
  }

  private async recordViewHistory(userId: string, dreamId: string) {
    const { data: existing } = await supabase
      .from('view_history')
      .select('id')
      .eq('user_id', userId)
      .eq('dream_id', dreamId)
      .single();

    if (existing) {
      await supabase
        .from('view_history')
        .update({ viewed_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('dream_id', dreamId);
    } else {
      await supabase.from('view_history').insert({ id: uuidv4(), user_id: userId, dream_id: dreamId });
    }
  }

  async createDream(data: {
    title: string;
    slug: string;
    content: string;
    category_id?: string;
    islamic_interpretation?: string;
    psychological_interpretation?: string;
    keywords?: string[];
    is_featured?: boolean;
    is_published?: boolean;
    meta_title?: string;
    meta_description?: string;
  }) {
    const { title, slug, content } = data;
    if (!title || !slug || !content) throw new AppError('Title, slug, and content are required', 400);

    const { data: existingSlug } = await supabase.from('dreams').select('id').eq('slug', slug).single();
    if (existingSlug) throw new AppError('A dream with this slug already exists', 400);

    const id = uuidv4();
    const { data: newDream, error } = await supabase
      .from('dreams')
      .insert({
        id,
        title,
        slug,
        content,
        category_id: data.category_id || null,
        islamic_interpretation: data.islamic_interpretation || null,
        psychological_interpretation: data.psychological_interpretation || null,
        keywords: data.keywords || [],
        is_featured: data.is_featured || false,
        is_published: data.is_published !== undefined ? data.is_published : true,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create dream', 500);
    return newDream;
  }

  async updateDream(id: string, data: {
    title?: string;
    slug?: string;
    content?: string;
    category_id?: string;
    islamic_interpretation?: string;
    psychological_interpretation?: string;
    keywords?: string[];
    is_featured?: boolean;
    is_published?: boolean;
    meta_title?: string;
    meta_description?: string;
  }) {
    const { data: existing } = await supabase.from('dreams').select('slug').eq('id', id).single();
    if (!existing) throw new AppError('Dream not found', 404);

    if (data.slug && data.slug !== existing.slug) {
      const { data: slugCheck } = await supabase.from('dreams').select('id').eq('slug', data.slug).neq('id', id).single();
      if (slugCheck) throw new AppError('A dream with this slug already exists', 400);
    }

    const updateData = {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.category_id !== undefined && { category_id: data.category_id }),
      ...(data.islamic_interpretation !== undefined && { islamic_interpretation: data.islamic_interpretation }),
      ...(data.psychological_interpretation !== undefined && { psychological_interpretation: data.psychological_interpretation }),
      ...(data.keywords !== undefined && { keywords: data.keywords }),
      ...(data.is_featured !== undefined && { is_featured: data.is_featured }),
      ...(data.is_published !== undefined && { is_published: data.is_published }),
      ...(data.meta_title !== undefined && { meta_title: data.meta_title }),
      ...(data.meta_description !== undefined && { meta_description: data.meta_description }),
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase.from('dreams').update(updateData).eq('id', id).select().single();
    if (error) throw new AppError('Failed to update dream', 500);
    return updated;
  }

  async deleteDream(id: string) {
    const { data: existing } = await supabase.from('dreams').select('id').eq('id', id).single();
    if (!existing) throw new AppError('Dream not found', 404);

    await supabase.from('dreams').delete().eq('id', id);
    return { success: true, message: 'Dream deleted successfully' };
  }

  async toggleLike(dreamId: string, userId: string) {
    const { data: existing } = await supabase
      .from('dream_likes')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('dream_likes').delete().eq('dream_id', dreamId).eq('user_id', userId);
      const { data: dream } = await supabase.from('dreams').select('like_count').eq('id', dreamId).single();
      await supabase
        .from('dreams')
        .update({ like_count: Math.max(0, (dream?.like_count || 1) - 1) })
        .eq('id', dreamId);
      return { success: true, liked: false, message: 'Dream unliked' };
    } else {
      const [likeRes, dreamRes] = await Promise.all([
        supabase.from('dream_likes').insert({ id: uuidv4(), dream_id: dreamId, user_id: userId }),
        supabase.from('dreams').select('like_count').eq('id', dreamId).single(),
      ]);
      const likeCount = dreamRes.data?.like_count || 0;
      await supabase
        .from('dreams')
        .update({ like_count: likeCount + 1 })
        .eq('id', dreamId);
      return { success: true, liked: true, message: 'Dream liked' };
    }
  }

  async toggleFavorite(dreamId: string, userId: string) {
    const { data: existing } = await supabase
      .from('favorites')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('favorites').delete().eq('dream_id', dreamId).eq('user_id', userId);
      return { success: true, favorited: false, message: 'Removed from favorites' };
    } else {
      await supabase.from('favorites').insert({ id: uuidv4(), dream_id: dreamId, user_id: userId });
      return { success: true, favorited: true, message: 'Added to favorites' };
    }
  }

  async getSimilarDreams(dreamId: string, limit = 5) {
    const { data: currentDream } = await supabase.from('dreams').select('category_id').eq('id', dreamId).single();
    if (!currentDream) throw new AppError('Dream not found', 404);

    const { data, error } = await supabase
      .from('dreams')
      .select('*, categories(name)')
      .eq('category_id', currentDream.category_id)
      .neq('id', dreamId)
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw new AppError('Failed to fetch similar dreams', 500);

    return (data || []).map((d: any) => ({
      ...d,
      category_name: d.categories?.name,
    }));
  }
}

export const dreamService = new DreamService();