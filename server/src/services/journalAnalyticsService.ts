import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class JournalAnalyticsService {
  async getCalendarData(userId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const [{ data: entries }, { data: sleepData }] = await Promise.all([
      supabase.from('dream_journal')
        .select('id, title, dream_date, mood, tags')
        .eq('user_id', userId)
        .gte('dream_date', startDate)
        .lt('dream_date', endDate)
        .order('dream_date'),
      supabase.from('sleep_quality')
        .select('*')
        .eq('user_id', userId)
        .gte('sleep_date', startDate)
        .lt('sleep_date', endDate)
        .order('sleep_date'),
    ]);

    return { entries: entries || [], sleepData: sleepData || [] };
  }

  async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data: entries } = await supabase
      .from('dream_journal')
      .select('mood, tags, dream_date')
      .eq('user_id', userId)
      .gte('dream_date', startDate)
      .lt('dream_date', endDate);

    if (!entries) return null;

    const moodDistribution: Record<string, number> = {};
    const keywordMap: Record<string, number> = {};
    const dayDistribution: Record<number, number> = {};

    entries.forEach((e: any) => {
      if (e.mood) moodDistribution[e.mood] = (moodDistribution[e.mood] || 0) + 1;
      const tags = Array.isArray(e.tags) ? e.tags : [];
      tags.forEach((t: string) => { keywordMap[t] = (keywordMap[t] || 0) + 1; });
      const day = new Date(e.dream_date).getDay();
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });

    const topMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topKeywords = Object.entries(keywordMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);

    return {
      totalDreams: entries.length,
      moodDistribution,
      topMood,
      topKeywords,
      dayDistribution,
      avgDreamsPerWeek: Math.round((entries.length / 4.3) * 10) / 10,
    };
  }

  async getSleepQuality(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('sleep_quality')
      .select('*')
      .eq('user_id', userId)
      .gte('sleep_date', since)
      .order('sleep_date');

    if (error) throw new AppError('Uyku verileri alınamadı', 500);
    return data || [];
  }

  async logSleepQuality(userId: string, sleepDate: string, quality: number, hoursSlept?: number, notes?: string) {
    const { data, error } = await supabase
      .from('sleep_quality')
      .upsert({
        user_id: userId,
        sleep_date: sleepDate,
        quality,
        hours_slept: hoursSlept || null,
        notes: notes || null,
      }, { onConflict: 'user_id,sleep_date' })
      .select()
      .single();

    if (error) throw new AppError('Uyku kalitesi kaydedilemedi', 500);
    return data;
  }

  async getSleepCorrelation(userId: string, days = 90) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [{ data: sleepData }, { data: journalData }] = await Promise.all([
      supabase.from('sleep_quality').select('*').eq('user_id', userId).gte('sleep_date', since),
      supabase.from('dream_journal').select('mood, dream_date').eq('user_id', userId).gte('dream_date', since),
    ]);

    if (!sleepData || !journalData) return { correlation: null, data: [] };

    const sleepByDate: Record<string, any> = {};
    sleepData.forEach((s: any) => { sleepByDate[s.sleep_date] = s; });

    const correlated = journalData.map((j: any) => ({
      date: j.dream_date,
      mood: j.mood,
      sleepQuality: sleepByDate[j.dream_date]?.quality || null,
      hoursSlept: sleepByDate[j.dream_date]?.hours_slept || null,
    })).filter(c => c.sleepQuality !== null);

    return { data: correlated };
  }
}

export const journalAnalyticsService = new JournalAnalyticsService();
