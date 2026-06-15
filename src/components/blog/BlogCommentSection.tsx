import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Send, CornerDownRight, Trash2, AlertCircle, Info, UserCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { BlogComment } from '@/types/blog';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { getFirstValidationMessage, guestCommentSchema, memberCommentSchema } from '@/lib/validation/forms';

interface BlogCommentSectionProps {
  postId: string;
}

const getAuthorDisplay = (comment: BlogComment) => {
  if (comment.user?.full_name) {
    return { name: comment.user.full_name, avatarUrl: comment.user.avatar_url || undefined, isGuest: false };
  }
  if (comment.user?.username) {
    return { name: comment.user.username, avatarUrl: comment.user.avatar_url || undefined, isGuest: false };
  }
  if (comment.guest_name) {
    return { name: comment.guest_name, avatarUrl: undefined, isGuest: true };
  }
  return { name: 'Anonim', avatarUrl: undefined, isGuest: true };
};

const getAuthorInitial = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
};

export function BlogCommentSection({ postId }: BlogCommentSectionProps) {
  const { user, profile } = useAuth();
  const { settings } = useSiteSettings();
  const isApproved = !settings.requireApproval;
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setIsLoading(false);
      return;
    }

    if (data) {
      const memberUserIds = [...new Set(data.filter(c => c.user_id).map((c) => c.user_id!))];
      let profileMap = new Map<string, { id: string; full_name: string | null; username: string | null; avatar_url: string | null }>();
      
      if (memberUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, username, avatar_url')
          .in('user_id', memberUserIds);

        profileMap = new Map(profiles?.map((p) => [p.user_id, {
          id: p.user_id,
          full_name: p.full_name,
          username: p.username,
          avatar_url: p.avatar_url,
        }]) || []);
      }

      const commentMap = new Map<string, BlogComment>();
      const rootComments: BlogComment[] = [];

      data.forEach((comment) => {
        const enrichedComment = {
          ...comment,
          user: comment.user_id ? (profileMap.get(comment.user_id) as BlogComment['user']) : undefined,
          replies: [] as BlogComment[],
        } as BlogComment;
        commentMap.set(comment.id, enrichedComment);
      });

      data.forEach((comment) => {
        const enrichedComment = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(enrichedComment);
          }
        } else {
          rootComments.push(enrichedComment);
        }
      });

      setComments(rootComments);
    }
    setIsLoading(false);
  }, [postId]);

  const fetchUserLikes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('blog_comment_likes')
      .select('comment_id')
      .eq('user_id', user.id);
    if (data) {
      setLikedComments(new Set(data.map((l) => l.comment_id)));
    }
  }, [user]);

  useEffect(() => {
    fetchComments();
    if (user) {
      fetchUserLikes();
    }
  }, [fetchComments, fetchUserLikes, user]);

  const handleSubmitComment = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) {
      toast.error('Yorum içeriği boş olamaz');
      return;
    }

    setIsSubmitting(true);

    if (user) {
      const validation = memberCommentSchema.safeParse({ content });
      if (!validation.success) {
        toast.error(getFirstValidationMessage(validation.error));
        setIsSubmitting(false);
        return;
      }
      const { error } = await supabase.from('blog_comments').insert({
        post_id: postId,
        user_id: user.id,
        content: validation.data.content,
        parent_id: parentId || null,
        is_approved: isApproved,
      });
      if (error) {
        toast.error('Yorum eklenirken bir hata oluştu');
        setIsSubmitting(false);
        return;
      }
    } else {
      const validation = guestCommentSchema.safeParse({ name: guestName, email: guestEmail, content });
      if (!validation.success) {
        toast.error(getFirstValidationMessage(validation.error));
        setIsSubmitting(false);
        return;
      }
      const { error } = await supabase.from('blog_comments').insert({
        post_id: postId,
        user_id: null,
        guest_name: validation.data.name,
        guest_email: validation.data.email,
        content: validation.data.content,
        parent_id: parentId || null,
        is_approved: isApproved,
      });
      if (error) {
        toast.error('Yorum eklenirken bir hata oluştu');
        setIsSubmitting(false);
        return;
      }
    }

    toast.success(
      settings.requireApproval
        ? 'Yorumunuz alındı, onaylandıktan sonra yayınlanacak'
        : 'Yorumunuz eklendi'
    );
    if (parentId) {
      setReplyContent('');
      setReplyingTo(null);
    } else {
      setNewComment('');
    }
    fetchComments();
    setIsSubmitting(false);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }
    const isLiked = likedComments.has(commentId);
    if (isLiked) {
      await supabase.from('blog_comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      setLikedComments((prev) => { const s = new Set(prev); s.delete(commentId); return s; });
    } else {
      await supabase.from('blog_comment_likes').insert({ comment_id: commentId, user_id: user.id });
      setLikedComments((prev) => new Set(prev).add(commentId));
    }
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    const { error } = await supabase.from('blog_comments').delete().eq('id', commentId);
    if (error) {
      toast.error('Yorum silinirken bir hata oluştu');
    } else {
      toast.success('Yorum silindi');
      fetchComments();
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: BlogComment; depth?: number }) => {
    const author = getAuthorDisplay(comment);
    const isOwner = user?.id === comment.user_id;
    const isLiked = likedComments.has(comment.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}
      >
        <div className="flex gap-3 py-4">
          {author.avatarUrl ? (
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={author.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                {getAuthorInitial(author.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${
              author.isGuest
                ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 text-amber-700 dark:text-amber-300'
                : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'
            }`}>
              {getAuthorInitial(author.name)}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900 dark:text-white">{author.name}</span>
              {author.isGuest && (
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-md font-normal">Misafir</Badge>
              )}
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
              </span>
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{comment.content}</p>
            
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 text-sm transition-colors ${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {comment.like_count > 0 && comment.like_count}
              </button>
              
              {user && depth < 2 && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <CornerDownRight className="w-4 h-4" />
                  Yanıtla
                </button>
              )}
              
              {isOwner && (
                <button onClick={() => handleDeleteComment(comment.id)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <AnimatePresence>
              {replyingTo === comment.id && user && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3">
                  <div className="flex gap-2">
                    <Textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Yanıtınızı yazın..." className="min-h-[80px] resize-none" />
                    <Button onClick={() => handleSubmitComment(comment.id)} disabled={isSubmitting || !replyContent.trim()} size="sm" className="shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-0">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const canSubmitGuest = guestName.trim().length >= 2 && guestEmail.includes('@') && newComment.trim().length >= 10;

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-indigo-600" />
        Yorumlar ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      <div className="mb-6">
        {!user && (
          <div className="p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-3 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
              <Info className="h-3.5 w-3.5" />
              Yorum yapmak için üye olmak zorunda değilsiniz. Sadece adınız ve e-postanız yeterli.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="blog-guest-name" className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <UserCircle2 className="h-3.5 w-3.5" />
                  Ad Soyad <span className="text-red-500">*</span>
                </Label>
                <Input id="blog-guest-name" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Adınız Soyadınız" maxLength={100} className="bg-white dark:bg-slate-900" />
              </div>
              <div>
                <Label htmlFor="blog-guest-email" className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  E-posta <span className="text-red-500">*</span>
                </Label>
                <Input id="blog-guest-email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="ornek@email.com" maxLength={200} className="bg-white dark:bg-slate-900" />
              </div>
            </div>
          </div>
        )}

        {user ? (
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                {(profile?.full_name || profile?.username || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Düşüncelerinizi paylaşın..." className="min-h-[100px] resize-none mb-3" />
              <Button onClick={() => handleSubmitComment()} disabled={isSubmitting || !newComment.trim()} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                <Send className="w-4 h-4 mr-2" />
                Yorum Yap
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Düşüncelerinizi yazın..." className="min-h-[100px] resize-none mb-3" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{newComment.length}/1000 karakter</span>
              <Button onClick={() => handleSubmitComment()} disabled={isSubmitting || !canSubmitGuest} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                {isSubmitting ? <span className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" /> : <Send className="w-4 h-4 mr-2" />}
                Misafir Olarak Yorum Yap
              </Button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
