import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class CulturalService {
  async getCultures() {
    const { data, error } = await supabase
      .from('cultural_interpretations')
      .select('culture_name, culture_code, region')
      .order('culture_name');

    if (error) throw new AppError('Kültürler alınamadı', 500);

    const unique = new Map<string, any>();
    (data || []).forEach((d: any) => {
      if (!unique.has(d.culture_code)) unique.set(d.culture_code, d);
    });
    return Array.from(unique.values());
  }

  async getByCulture(cultureCode: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('cultural_interpretations')
      .select('*', { count: 'exact' })
      .eq('culture_code', cultureCode)
      .order('symbol_name')
      .range(offset, offset + limit - 1);

    if (error) throw new AppError('Yorumlar alınamadı', 500);
    return { data: data || [], total: count || 0 };
  }

  async compareSymbol(symbolName: string) {
    const [cultural, ottoman] = await Promise.all([
      supabase.from('cultural_interpretations').select('*').ilike('symbol_name', `%${symbolName}%`),
      supabase.from('ottoman_interpretations').select('*').ilike('symbol_name', `%${symbolName}%`),
    ]);

    return {
      cultural: cultural.data || [],
      ottoman: ottoman.data || [],
    };
  }

  async getOttomanInterpretations(page = 1, limit = 50, search?: string) {
    const offset = (page - 1) * limit;
    let query = supabase.from('ottoman_interpretations').select('*', { count: 'exact' });
    if (search) query = query.or(`symbol_name.ilike.%${search}%,interpretation.ilike.%${search}%`);
    query = query.order('symbol_name').range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError('Osmanlı tabirleri alınamadı', 500);
    return { data: data || [], total: count || 0 };
  }

  async createCultural(interpretation: any) {
    const { data, error } = await supabase
      .from('cultural_interpretations')
      .insert(interpretation)
      .select()
      .single();
    if (error) throw new AppError('Yorum oluşturulamadı', 500);
    return data;
  }

  async createOttoman(interpretation: any) {
    const { data, error } = await supabase
      .from('ottoman_interpretations')
      .insert(interpretation)
      .select()
      .single();
    if (error) throw new AppError('Osmanlı tabiri oluşturulamadı', 500);
    return data;
  }
}

export const culturalService = new CulturalService();
