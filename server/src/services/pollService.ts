import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class PollService {
  async getTodayPoll() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('daily_polls')
      .select('*')
      .eq('poll_date', today)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    const { data: votes } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', data.id);

    const results = (data.options as string[]).map((opt, i) => ({
      option: opt,
      count: (votes || []).filter((v: any) => v.option_index === i).length,
    }));

    return { ...data, results, totalVotes: (votes || []).length };
  }

  async vote(pollId: string, userId: string, optionIndex: number) {
    const { data: existing } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (existing) throw new AppError('Bu ankete zaten oy verdiniz', 400);

    const { error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: pollId, user_id: userId, option_index: optionIndex });

    if (error) throw new AppError('Oy kullanılamadı', 500);
    return { success: true };
  }

  async getUserVote(pollId: string, userId: string) {
    const { data } = await supabase
      .from('poll_votes')
      .select('option_index')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    return data?.option_index ?? null;
  }

  async getPollHistory(limit = 30) {
    const { data, error } = await supabase
      .from('daily_polls')
      .select('*')
      .order('poll_date', { ascending: false })
      .limit(limit);

    if (error) throw new AppError('Anket geçmişi alınamadı', 500);
    return data || [];
  }

  async createPoll(question: string, pollDate: string, options: string[]) {
    const { data, error } = await supabase
      .from('daily_polls')
      .insert({ question, poll_date: pollDate, options })
      .select()
      .single();

    if (error) throw new AppError('Anket oluşturulamadı', 500);
    return data;
  }
}

export const pollService = new PollService();
