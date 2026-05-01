import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

export class AdminService {
  async getStatistics() {
    const [{ count: dreamCount }, { count: blogPostCount }, { count: userCount }, { count: categoryCount }, { count: subscriberCount }] = await Promise.all([
      supabase.from('dreams').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
      supabase.from('blog_subscribers').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    ]);

    const [{ count: totalViews }, { count: totalLikes }, { count: totalComments }, { count: featuredDreams }] = await Promise.all([
      supabase.from('dreams').select('view_count', { count: 'exact', head: true }),
      supabase.from('dream_likes').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('dreams').select('*', { count: 'exact', head: true }).eq('is_featured', true),
    ]);

    const { data: viewData } = await supabase.from('dreams').select('view_count');
    const sumViews = (viewData || []).reduce((sum: number, d: any) => sum + (d.view_count || 0), 0);

    const [{ data: recentDreams }, { data: recentPosts }] = await Promise.all([
      supabase.from('dreams').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('blog_posts').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    return {
      totalDreams: dreamCount || 0,
      totalCategories: categoryCount || 0,
      totalUsers: userCount || 0,
      totalViews: sumViews,
      totalLikes: totalLikes || 0,
      totalComments: totalComments || 0,
      featuredDreams: featuredDreams || 0,
      avgViewsPerDream: dreamCount ? Math.round(sumViews / dreamCount) : 0,
      dreams: dreamCount || 0,
      categories: recentDreams || [],
    };
  }

  async getCategoryStats() {
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: dreams } = await supabase.from('dreams').select('category_id');

    const countMap: Record<string, number> = {};
    (dreams || []).forEach((d: any) => {
      if (d.category_id) countMap[d.category_id] = (countMap[d.category_id] || 0) + 1;
    });

    return (categories || []).map((c: any) => ({
      name: c.name,
      dreamCount: countMap[c.id] || 0,
    })).sort((a: any, b: any) => b.dreamCount - a.dreamCount);
  }

  async getTopDreams(limit = 10) {
    const { data, error } = await supabase
      .from('dreams')
      .select('id, title, view_count, like_count')
      .order('view_count', { ascending: false })
      .limit(limit);
    if (error) throw new AppError('Failed to fetch top dreams', 500);
    return data || [];
  }

  async getComments(status?: string) {
    let query = supabase.from('comments').select('*, dreams(title), profiles(email)');
    if (status === 'pending') query = query.eq('is_approved', false);
    else if (status === 'approved') query = query.eq('is_approved', true);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new AppError('Failed to fetch comments', 500);
    return data || [];
  }

  async approveComment(commentId: string) {
    const { error } = await supabase.from('comments').update({ is_approved: true }).eq('id', commentId);
    if (error) throw new AppError('Failed to approve comment', 500);
  }

  async rejectComment(commentId: string) {
    const { error } = await supabase.from('comments').update({ is_approved: false }).eq('id', commentId);
    if (error) throw new AppError('Failed to reject comment', 500);
  }

  async deleteComment(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw new AppError('Failed to delete comment', 500);
  }

  async getContactMessages() {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) throw new AppError('Failed to fetch messages', 500);
    return data || [];
  }

  async markMessageRead(messageId: string) {
    const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', messageId);
    if (error) throw new AppError('Failed to mark message read', 500);
  }

  async deleteMessage(messageId: string) {
    const { error } = await supabase.from('contact_messages').delete().eq('id', messageId);
    if (error) throw new AppError('Failed to delete message', 500);
  }

  async getUsers(search?: string, role?: string, page = 1, limit = 20) {
    let query = supabase.from('users').select('*, profiles(*), user_roles(role)', { count: 'exact' });
    if (search) query = query.or(`email.ilike.%${search}%,id.ilike.%${search}%`);
    const { data, error } = await query.range((page - 1) * limit, page * limit - 1).order('created_at', { ascending: false });
    if (error) throw new AppError('Failed to fetch users', 500);
    return data || [];
  }

  async updateUserRole(userId: string, role: string) {
    const { data: existing } = await supabase.from('user_roles').select('id').eq('user_id', userId).single();
    if (existing) {
      const { error } = await supabase.from('user_roles').update({ role }).eq('user_id', userId);
      if (error) throw new AppError('Failed to update user role', 500);
    } else {
      const { error } = await supabase.from('user_roles').insert({ id: crypto.randomUUID(), user_id: userId, role });
      if (error) throw new AppError('Failed to update user role', 500);
    }
  }

  async deleteUser(userId: string) {
    await Promise.all([
      supabase.from('profiles').delete().eq('user_id', userId),
      supabase.from('user_roles').delete().eq('user_id', userId),
      supabase.from('favorites').delete().eq('user_id', userId),
      supabase.from('view_history').delete().eq('user_id', userId),
      supabase.from('comments').delete().eq('user_id', userId),
      supabase.from('dream_journal').delete().eq('user_id', userId),
    ]);
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw new AppError('Failed to delete user', 500);
  }

  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw new AppError('Failed to fetch audit logs', 500);
    return data || [];
  }

  async getNotifications(userId?: string) {
    let query = supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
    if (userId) query = query.or(`user_id.eq.${userId},user_id.is.null`);
    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch notifications', 500);
    return data || [];
  }

  async createNotification(notification: any) {
    const { data, error } = await supabase.from('admin_notifications').insert(notification).select().single();
    if (error) throw new AppError('Failed to create notification', 500);
    return data;
  }

  async updateNotification(id: string, updates: any) {
    const { error } = await supabase.from('admin_notifications').update(updates).eq('id', id);
    if (error) throw new AppError('Failed to update notification', 500);
  }

  async deleteNotification(id: string) {
    const { error } = await supabase.from('admin_notifications').delete().eq('id', id);
    if (error) throw new AppError('Failed to delete notification', 500);
  }

  async toggleNotification(id: string, isActive: boolean) {
    const { error } = await supabase.from('admin_notifications').update({ is_active: isActive }).eq('id', id);
    if (error) throw new AppError('Failed to toggle notification', 500);
  }

  async markNotificationRead(id: string) {
    const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('id', id);
    if (error) throw new AppError('Failed to mark notification read', 500);
  }

  async getActiveNotifications() {
    const { data, error } = await supabase.from('admin_notifications').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (error) throw new AppError('Failed to fetch active notifications', 500);
    return data || [];
  }
}

export const adminService = new AdminService();