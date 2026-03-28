import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import type { Dream, Category, Comment, DreamLike, Favorite, ViewHistory } from '../types/index';

interface DreamWithCategory extends Dream {
  category_name?: string;
  category_slug?: string;
}

export class DreamService {
  async getDreams(filters: {
    page?: number;
    limit?: number;
    category_id?: string;
    search?: string;
    is_featured?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    dreams: DreamWithCategory[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('dreams')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('is_published', true);

    if (filters.category_id) query = query.eq('category_id', filters.category_id);
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    if (filters.is_featured !== undefined) query = query.eq('is_featured', filters.is_featured);

    const validSortColumns = ['created_at', 'view_count', 'like_count', 'title'];
    const sortBy = validSortColumns.includes(filters.sort_by || '') ? filters.sort_by! : 'created_at';
    const sortOrder = filters.sort_order?.toUpperCase() === 'ASC' ? true : false;
    query = query.order(sortBy, { ascending: sortOrder });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw new AppError('Failed to fetch dreams', 500);

    const dreams = (data || []).map((d: any) => ({
      ...d,
      category_name: d.categories?.name,
      category_slug: d.categories?.slug,
    }));

    return {
      dreams,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getFeaturedDreams(limit: number = 5): Promise<DreamWithCategory[]> {
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

  async getDreamBySlug(slug: string): Promise<{
    dream: DreamWithCategory;
    isLiked: boolean;
    isFavorited: boolean;
    userId?: string;
  } | null> {
    const { data, error } = await supabase
      .from('dreams')
      .select('*, categories(name, slug)')
      .eq('slug', slug)
      .single();

    if (!data || error) return null;

    await supabase
      .from('dreams')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', data.id);

    const dream: DreamWithCategory = {
      ...data,
      category_name: (data as any).categories?.name,
      category_slug: (data as any).categories?.slug,
    };

    return { dream, isLiked: false, isFavorited: false };
  }

  async createDream(
    data: Omit<Dream, 'id' | 'created_at' | 'updated_at'> & { userId: string }
  ): Promise<Dream> {
    const { title, slug, content, category_id, islamic_interpretation, psychological_interpretation, keywords, is_featured, is_published, meta_title, meta_description } = data;

    const { data: existingSlug } = await supabase
      .from('dreams')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingSlug) throw new AppError('A dream with this slug already exists', 400);

    const id = uuidv4();

    const { data: newDream, error } = await supabase
      .from('dreams')
      .insert({
        id,
        title,
        slug,
        content,
        category_id: category_id || null,
        islamic_interpretation: islamic_interpretation || null,
        psychological_interpretation: psychological_interpretation || null,
        keywords: keywords || [],
        is_featured: is_featured || false,
        is_published: is_published !== undefined ? is_published : true,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create dream', 500);
    return newDream as Dream;
  }

  async updateDream(
    id: string,
    data: Partial<Omit<Dream, 'id' | 'created_at' | 'updated_at'> & { slug?: string }>
  ): Promise<Dream> {
    const { data: existing } = await supabase
      .from('dreams')
      .select('*')
      .eq('id', id)
      .single();

    if (!existing) throw new AppError('Dream not found', 404);

    if (data.slug && data.slug !== existing.slug) {
      const { data: slugCheck } = await supabase
        .from('dreams')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .single();

      if (slugCheck) throw new AppError('A dream with this slug already exists', 400);
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.category_id !== undefined) updateData.category_id = data.category_id;
    if (data.islamic_interpretation !== undefined) updateData.islamic_interpretation = data.islamic_interpretation;
    if (data.psychological_interpretation !== undefined) updateData.psychological_interpretation = data.psychological_interpretation;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;
    if (data.is_published !== undefined) updateData.is_published = data.is_published;
    if (data.meta_title !== undefined) updateData.meta_title = data.meta_title;
    if (data.meta_description !== undefined) updateData.meta_description = data.meta_description;

    const { data: updated, error } = await supabase
      .from('dreams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update dream', 500);
    return updated as Dream;
  }

  async deleteDream(id: string): Promise<{ message: string }> {
    const { data: existing } = await supabase
      .from('dreams')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) throw new AppError('Dream not found', 404);

    await supabase.from('dreams').delete().eq('id', id);
    return { message: 'Dream deleted successfully' };
  }

  async toggleLike(dreamId: string, userId: string): Promise<{ liked: boolean; message: string }> {
    const { data: existing } = await supabase
      .from('dream_likes')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('dream_likes').delete().eq('dream_id', dreamId).eq('user_id', userId);
      const { data: dream } = await supabase.from('dreams').select('like_count').eq('id', dreamId).single();
      await supabase.from('dreams').update({ like_count: Math.max(0, (dream?.like_count || 1) - 1) }).eq('id', dreamId);
      return { liked: false, message: 'Dream unliked' };
    } else {
      await supabase.from('dream_likes').insert({ id: uuidv4(), dream_id: dreamId, user_id: userId });
      const { data: dream } = await supabase.from('dreams').select('like_count').eq('id', dreamId).single();
      await supabase.from('dreams').update({ like_count: (dream?.like_count || 0) + 1 }).eq('id', dreamId);
      return { liked: true, message: 'Dream liked' };
    }
  }

  async toggleFavorite(dreamId: string, userId: string): Promise<{ favorited: boolean; message: string }> {
    const { data: existing } = await supabase
      .from('favorites')
      .select('*')
      .eq('dream_id', dreamId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('favorites').delete().eq('dream_id', dreamId).eq('user_id', userId);
      return { favorited: false, message: 'Removed from favorites' };
    } else {
      await supabase.from('favorites').insert({ id: uuidv4(), dream_id: dreamId, user_id: userId });
      return { favorited: true, message: 'Added to favorites' };
    }
  }

  async getComments(dreamId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('dream_id', dreamId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch comments', 500);

    return (data || []).map((c: any) => ({
      ...c,
      author_name: c.profiles?.full_name,
      author_avatar: c.profiles?.avatar_url,
    }));
  }

  async addComment(dreamId: string, userId: string, content: string): Promise<Comment> {
    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400);
    }

    const commentId = uuidv4();

    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({ id: commentId, content, dream_id: dreamId, user_id: userId, is_approved: true, like_count: 0 })
      .select('*, profiles(full_name, avatar_url)')
      .single();

    if (error) throw new AppError('Failed to add comment', 500);

    return {
      ...newComment,
      author_name: (newComment as any).profiles?.full_name,
      author_avatar: (newComment as any).profiles?.avatar_url,
    } as Comment;
  }

  async getSimilarDreams(dreamId: string, limit: number = 5): Promise<DreamWithCategory[]> {
    const { data: currentDream } = await supabase
      .from('dreams')
      .select('category_id')
      .eq('id', dreamId)
      .single();

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
