import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

export class ReactionService {
  async getReactions(commentId: string) {
    const { data, error } = await supabase
      .from('comment_reactions')
      .select('emoji, user_id')
      .eq('comment_id', commentId);

    if (error) throw new AppError('Reaksiyonlar alınamadı', 500);

    const emojiMap: Record<string, { count: number; userIds: string[] }> = {};
    (data || []).forEach((r: any) => {
      if (!emojiMap[r.emoji]) emojiMap[r.emoji] = { count: 0, userIds: [] };
      emojiMap[r.emoji].count++;
      emojiMap[r.emoji].userIds.push(r.user_id);
    });

    return emojiMap;
  }

  async toggleReaction(commentId: string, userId: string, emoji: string) {
    const { data: existing } = await supabase
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      await supabase.from('comment_reactions').delete().eq('id', existing.id);
      return { added: false };
    }

    const { error } = await supabase
      .from('comment_reactions')
      .insert({ comment_id: commentId, user_id: userId, emoji });

    if (error) throw new AppError('Reaksiyon eklenemedi', 500);
    return { added: true };
  }
}

export const reactionService = new ReactionService();
