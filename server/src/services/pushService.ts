import webpush from 'web-push';
import { supabase } from '../config/database';
import logger from '../utils/logger';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:info@ruyatabirleri.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export class PushService {
  async sendToUser(userId: string, title: string, body: string, url?: string) {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (!subscriptions || subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys } as any,
          payload
        );
      } catch (error: any) {
        if (error.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        logger.warn({ err: error, userId }, 'Push notification failed');
      }
    }
  }

  async sendToAll(title: string, body: string, url?: string) {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (!subscriptions) return;

    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
      icon: '/icon-192x192.png',
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys } as any,
          payload
        );
        sent++;
      } catch (error: any) {
        if (error.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
        failed++;
      }
    }

    logger.info({ sent, failed }, 'Push broadcast completed');
    return { sent, failed };
  }

  async sendDailyReminders() {
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('daily_reminder', true);

    if (!preferences) return;

    for (const pref of preferences) {
      await this.sendToUser(
        pref.user_id,
        'Rüya Günlüğü Hatırlatıcı',
        'Günaydın! Dün gece gördüğünüz rüyayı kaydetmeyi unutmayın.',
        '/ruya-gunlugum'
      );

      await supabase.from('user_notifications').insert({
        user_id: pref.user_id,
        type: 'reminder',
        title: 'Rüya Günlüğü Hatırlatıcı',
        message: 'Günaydın! Dün gece gördüğünüz rüyayı kaydetmeyi unutmayın.',
        link: '/ruya-gunlugum',
      });
    }
  }

  async generateWeeklySummaries() {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = now.toISOString().split('T')[0];

    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('weekly_summary', true);

    if (!preferences) return;

    for (const pref of preferences) {
      const { data: entries } = await supabase
        .from('dream_journal')
        .select('mood, tags, dream_date')
        .eq('user_id', pref.user_id)
        .gte('dream_date', weekStartStr)
        .lte('dream_date', weekEndStr);

      if (!entries || entries.length === 0) continue;

      const moodMap: Record<string, number> = {};
      const keywordMap: Record<string, number> = {};
      entries.forEach((e: any) => {
        if (e.mood) moodMap[e.mood] = (moodMap[e.mood] || 0) + 1;
        (Array.isArray(e.tags) ? e.tags : []).forEach((t: string) => {
          keywordMap[t] = (keywordMap[t] || 0) + 1;
        });
      });

      const topMood = Object.entries(moodMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
      const topKeywords = Object.entries(keywordMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);

      const MOOD_TR: Record<string, string> = {
        happy: 'mutlu', sad: 'üzgün', scared: 'korkmuş', confused: 'şaşkın',
        peaceful: 'huzurlu', anxious: 'endişeli', excited: 'heyecanlı', neutral: 'nötr',
      };

      const summaryText = `Bu hafta ${entries.length} rüya kaydettiniz. Baskın ruh haliniz: ${MOOD_TR[topMood] || topMood}${topKeywords.length > 0 ? `. En sık görülen temalar: ${topKeywords.join(', ')}` : ''}.`;

      await supabase.from('weekly_summaries').upsert({
        user_id: pref.user_id,
        week_start: weekStartStr,
        week_end: weekEndStr,
        total_dreams: entries.length,
        top_mood: topMood,
        top_keywords: topKeywords,
        summary_text: summaryText,
        sent_at: new Date().toISOString(),
      }, { onConflict: 'user_id,week_start' });

      await this.sendToUser(
        pref.user_id,
        'Haftalık Rüya Özeti',
        summaryText,
        '/ruya-gunlugum'
      );

      await supabase.from('user_notifications').insert({
        user_id: pref.user_id,
        type: 'weekly_summary',
        title: 'Haftalık Rüya Özeti',
        message: summaryText,
        link: '/ruya-gunlugum',
      });
    }
  }
}

export const pushService = new PushService();
