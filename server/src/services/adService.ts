import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class AdService {
  async getActiveAds(position?: string) {
    let query = supabase
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString());

    if (position) query = query.eq('position', position);

    const { data, error } = await query;
    if (error) throw new AppError('Reklamlar alınamadı', 500);
    return (data || []).filter((a: any) => !a.end_date || new Date(a.end_date) > new Date());
  }

  async recordImpression(adId: string) {
    const { data } = await supabase.from('ads').select('impression_count').eq('id', adId).single();
    await supabase.from('ads').update({ impression_count: ((data as any)?.impression_count || 0) + 1 }).eq('id', adId);
  }

  async recordClick(adId: string) {
    const { data } = await supabase.from('ads').select('click_count').eq('id', adId).single();
    await supabase.from('ads').update({ click_count: ((data as any)?.click_count || 0) + 1 }).eq('id', adId);
  }

  async getAll() {
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (error) throw new AppError('Reklamlar alınamadı', 500);
    return data || [];
  }

  async create(ad: any) {
    const { data, error } = await supabase.from('ads').insert(ad).select().single();
    if (error) throw new AppError('Reklam oluşturulamadı', 500);
    return data;
  }

  async update(id: string, updates: any) {
    const { data, error } = await supabase.from('ads').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw new AppError('Reklam güncellenemedi', 500);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (error) throw new AppError('Reklam silinemedi', 500);
  }

  async getSponsoredContent() {
    const { data, error } = await supabase
      .from('sponsored_content')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString());

    if (error) throw new AppError('Sponsorlu içerik alınamadı', 500);
    return data || [];
  }

  async createSponsored(content: any) {
    const { data, error } = await supabase.from('sponsored_content').insert(content).select().single();
    if (error) throw new AppError('Sponsorlu içerik oluşturulamadı', 500);
    return data;
  }
}

export const adService = new AdService();
