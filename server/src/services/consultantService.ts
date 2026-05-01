import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class ConsultantService {
  async getAll(available?: boolean) {
    let query = supabase.from('consultants').select('*').order('rating', { ascending: false });
    if (available !== undefined) query = query.eq('is_available', available);
    const { data, error } = await query;
    if (error) throw new AppError('Danışmanlar alınamadı', 500);
    return data || [];
  }

  async getById(id: string) {
    const { data, error } = await supabase.from('consultants').select('*').eq('id', id).single();
    if (error || !data) throw new AppError('Danışman bulunamadı', 404);
    return data;
  }

  async bookAppointment(consultantId: string, userId: string, appointmentDate: string, durationMinutes = 60, notes?: string) {
    const { data: conflict } = await supabase
      .from('appointments')
      .select('id')
      .eq('consultant_id', consultantId)
      .eq('appointment_date', appointmentDate)
      .not('status', 'eq', 'cancelled')
      .single();

    if (conflict) throw new AppError('Bu saat dilimi dolu', 400);

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        consultant_id: consultantId,
        user_id: userId,
        appointment_date: appointmentDate,
        duration_minutes: durationMinutes,
        notes: notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw new AppError('Randevu oluşturulamadı', 500);
    return data;
  }

  async getUserAppointments(userId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, consultants(title, avatar_url)')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: false });

    if (error) throw new AppError('Randevular alınamadı', 500);
    return data || [];
  }

  async cancelAppointment(appointmentId: string, userId: string) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .eq('user_id', userId);

    if (error) throw new AppError('Randevu iptal edilemedi', 500);
  }

  async createConsultant(consultant: any) {
    const { data, error } = await supabase
      .from('consultants')
      .insert(consultant)
      .select()
      .single();
    if (error) throw new AppError('Danışman oluşturulamadı', 500);
    return data;
  }
}

export const consultantService = new ConsultantService();
