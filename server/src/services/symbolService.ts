import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class SymbolService {
  async getAll(page = 1, limit = 50, search?: string) {
    const offset = (page - 1) * limit;
    let query = supabase.from('dream_symbols').select('*', { count: 'exact' });

    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    query = query.order('name').range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError('Semboller alınamadı', 500);
    return { data: data || [], pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } };
  }

  async getBySlug(slug: string) {
    const { data, error } = await supabase
      .from('dream_symbols')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) throw new AppError('Sembol bulunamadı', 404);

    await supabase
      .from('dream_symbols')
      .update({ view_count: ((data as any).view_count || 0) + 1 })
      .eq('id', data.id);

    return data;
  }

  async getRelated(slug: string) {
    const { data: symbol } = await supabase
      .from('dream_symbols')
      .select('related_symbols')
      .eq('slug', slug)
      .single();

    if (!symbol || !(symbol as any).related_symbols?.length) return [];

    const { data } = await supabase
      .from('dream_symbols')
      .select('name, slug, description')
      .in('name', (symbol as any).related_symbols);

    return data || [];
  }

  async create(symbol: any) {
    const { data, error } = await supabase
      .from('dream_symbols')
      .insert(symbol)
      .select()
      .single();
    if (error) throw new AppError('Sembol oluşturulamadı', 500);
    return data;
  }

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('dream_symbols')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new AppError('Sembol güncellenemedi', 500);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabase.from('dream_symbols').delete().eq('id', id);
    if (error) throw new AppError('Sembol silinemedi', 500);
  }
}

export const symbolService = new SymbolService();
