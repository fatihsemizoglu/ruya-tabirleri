import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import crypto from 'crypto';

export class BlogService {
  async getPosts(options: {
    page?: number;
    limit?: number;
    category_id?: string;
    is_published?: string;
    search?: string;
  } = {}) {
    const { page = 1, limit = 20, category_id, is_published, search } = options;
    const offset = (page - 1) * limit;

    let query = supabase.from('blog_posts').select('*, blog_categories(name, slug)', { count: 'exact' });

    if (is_published !== undefined && is_published !== 'all') {
      query = query.eq('is_published', is_published === 'true');
    }
    if (category_id) query = query.eq('category_id', category_id);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError(`Failed to fetch posts: ${error.message}`, 500);

    const posts = (data || []).map((p: any) => ({
      ...p,
      category_name: p.blog_categories?.name,
      category_slug: p.blog_categories?.slug,
    }));

    return {
      data: posts,
      pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    };
  }

  async getPostBySlug(slug: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*, blog_categories(*), profiles(email, full_name)')
      .eq('slug', slug)
      .single();
    if (error) throw new AppError('Post not found', 404);

    await supabase.from('blog_posts').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id);
    return data;
  }

  async createPost(post: any) {
    const { data, error } = await supabase.from('blog_posts').insert(post).select().single();
    if (error) throw new AppError(`Failed to create post: ${error.message}`, 500);
    return data;
  }

  async updatePost(id: string, updates: any) {
    const { data, error } = await supabase.from('blog_posts').update(updates).eq('id', id).select().single();
    if (error) throw new AppError(`Failed to update post: ${error.message}`, 500);
    return data;
  }

  async deletePost(id: string) {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) throw new AppError(`Failed to delete post: ${error.message}`, 500);
  }

  async getCategories() {
    const [{ data: categories }, { data: posts }] = await Promise.all([
      supabase.from('blog_categories').select('*').order('name'),
      supabase.from('blog_posts').select('category_id').eq('is_published', true),
    ]);

    if (!categories) throw new AppError('Failed to fetch categories', 500);

    const countMap: Record<string, number> = {};
    (posts || []).forEach((p: any) => {
      if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
    });

    return categories.map((c: any) => ({ ...c, post_count: countMap[c.id] || 0 }));
  }

  async createCategory(category: any) {
    const { data, error } = await supabase.from('blog_categories').insert(category).select().single();
    if (error) throw new AppError(`Failed to create category: ${error.message}`, 500);
    return data;
  }

  async updateCategory(id: string, updates: any) {
    const { data, error } = await supabase.from('blog_categories').update(updates).eq('id', id).select().single();
    if (error) throw new AppError(`Failed to update category: ${error.message}`, 500);
    return data;
  }

  async deleteCategory(id: string) {
    const { error } = await supabase.from('blog_categories').delete().eq('id', id);
    if (error) throw new AppError(`Failed to delete category: ${error.message}`, 500);
  }

  async getTags() {
    const { data, error } = await supabase.from('blog_tags').select('*').order('name');
    if (error) throw new AppError(`Failed to fetch tags: ${error.message}`, 500);
    return data || [];
  }

  async getComments(postId?: string, status?: string) {
    let query = supabase.from('blog_comments').select('*, blog_posts(title), profiles(email)');
    if (postId) query = query.eq('post_id', postId);
    if (status === 'pending') query = query.eq('is_approved', false);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new AppError(`Failed to fetch comments: ${error.message}`, 500);
    return data || [];
  }

  async createComment(comment: any) {
    const { data, error } = await supabase.from('blog_comments').insert(comment).select().single();
    if (error) throw new AppError(`Failed to create comment: ${error.message}`, 500);
    return data;
  }

  async approveComment(id: string) {
    const { error } = await supabase.from('blog_comments').update({ is_approved: true }).eq('id', id);
    if (error) throw new AppError(`Failed to approve comment: ${error.message}`, 500);
  }

  async deleteComment(id: string) {
    const { error } = await supabase.from('blog_comments').delete().eq('id', id);
    if (error) throw new AppError(`Failed to delete comment: ${error.message}`, 500);
  }

  async getSubscribers(verified?: boolean) {
    let query = supabase.from('blog_subscribers').select('*').order('created_at', { ascending: false });
    if (verified !== undefined) query = query.eq('is_verified', verified);
    const { data, error } = await query;
    if (error) throw new AppError(`Failed to fetch subscribers: ${error.message}`, 500);
    return data || [];
  }

  async subscribe(email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const { data, error } = await supabase
      .from('blog_subscribers')
      .insert({ email, verification_token: token, is_verified: false })
      .select()
      .single();
    if (error) throw new AppError(`Failed to subscribe: ${error.message}`, 500);
    return { subscriber: data, token };
  }

  async verifySubscriber(token: string) {
    const { error } = await supabase.from('blog_subscribers').update({ is_verified: true }).eq('verification_token', token);
    if (error) throw new AppError(`Failed to verify subscriber: ${error.message}`, 500);
  }

  async unsubscribe(email: string) {
    const { error } = await supabase.from('blog_subscribers').delete().eq('email', email);
    if (error) throw new AppError(`Failed to unsubscribe: ${error.message}`, 500);
  }
}

export const blogService = new BlogService();