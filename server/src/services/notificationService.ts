import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class NotificationService {
  async getUserNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const offset = (page - 1) * limit;
    let query = supabase
      .from('user_notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (unreadOnly) query = query.eq('is_read', false);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError('Bildirimler alınamadı', 500);
    return { data: data || [], total: count || 0 };
  }

  async getUnreadCount(userId: string) {
    const { count } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return count || 0;
  }

  async markAsRead(notificationId: string, userId: string) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw new AppError('Bildirim okundu yapılamadı', 500);
  }

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw new AppError('Bildirimler okundu yapılamadı', 500);
  }

  async create(userId: string, type: string, title: string, message: string, link?: string, data?: any) {
    const { error } = await supabase
      .from('user_notifications')
      .insert({ user_id: userId, type, title, message, link, data });

    if (error) throw new AppError('Bildirim oluşturulamadı', 500);
  }

  async delete(notificationId: string, userId: string) {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw new AppError('Bildirim silinemedi', 500);
  }

  async getPreferences(userId: string) {
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    return data || {
      new_dream_notification: true,
      comment_notification: true,
      daily_reminder: false,
      reminder_time: '08:00:00',
      weekly_summary: true,
      email_notifications: true,
      push_notifications: false,
    };
  }

  async updatePreferences(userId: string, preferences: any) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert({ user_id: userId, ...preferences, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw new AppError('Tercihler güncellenemedi', 500);
    return data;
  }

  async subscribeToPush(userId: string, subscription: { endpoint: string; keys: any }) {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({ user_id: userId, endpoint: subscription.endpoint, keys: subscription.keys }, { onConflict: 'user_id,endpoint' });

    if (error) throw new AppError('Push aboneliği oluşturulamadı', 500);
  }

  async unsubscribeFromPush(userId: string, endpoint: string) {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) throw new AppError('Push aboneliği iptal edilemedi', 500);
  }
}

export const notificationService = new NotificationService();
