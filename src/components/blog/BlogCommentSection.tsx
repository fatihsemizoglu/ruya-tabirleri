import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Heart, Send, CornerDownRight, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BlogComment } from '@/types/blog';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface BlogCommentSectionProps {
  postId: string;
}

export function BlogCommentSection({ postId }: BlogCommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchComments();
    if (user) {
      fetchUserLikes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user]);

  const fetchComments = async () => {
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
      // Fetch user profiles for comments
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, {
        id: p.user_id,
        full_name: p.full_name,
        username: p.username,
        avatar_url: p.avatar_url,
      }]));

      // Build comment tree
      const commentMap = new Map<string, BlogComment>();
      const rootComments: BlogComment[] = [];

      data.forEach((comment) => {
        const enrichedComment: BlogComment = {
          ...comment,
          user: profileMap.get(comment.user_id) as BlogComment['user'],
          replies: [],
        };
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
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('blog_comment_likes')
      .select('comment_id')
      .eq('user_id', user.id);

    if (data) {
      setLikedComments(new Set(data.map((l) => l.comment_id)));
    }
  };

  const handleSubmitComment = async (parentId?: string) => {
    if (!user) {
      toast.error('Yorum yapmak için giriş yapmalısınız');
      return;
    }

    const content = parentId ? replyContent : newComment;
    if (!content.trim()) {
      toast.error('Yorum içeriği boş olamaz');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('blog_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    });

    if (error) {
      toast.error('Yorum eklenirken bir hata oluştu');
      console.error(error);
    } else {
      toast.success('Yorumunuz eklendi');
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      fetchComments();
    }

    setIsSubmitting(false);
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }

    const isLiked = likedComments.has(commentId);

    if (isLiked) {
      await supabase
        .from('blog_comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      setLikedComments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    } else {
      await supabase.from('blog_comment_likes').insert({
        comment_id: commentId,
        user_id: user.id,
      });

      setLikedComments((prev) => new Set(prev).add(commentId));
    }

    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast.error('Yorum silinirken bir hata oluştu');
    } else {
      toast.success('Yorum silindi');
      fetchComments();
    }
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: BlogComment; depth?: number }) => {
    const isOwner = user?.id === comment.user_id;
    const isLiked = likedComments.has(comment.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${depth > 0 ? 'ml-8 pl-4 border-l-2 border-slate-200 dark:border-slate-700' : ''}`}
      >
        <div className="flex gap-3 py-4">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={comment.user?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
              {(comment.user?.full_name || comment.user?.username || 'U').charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900 dark:text-white">
                {comment.user?.full_name || comment.user?.username || 'Anonim'}
              </span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: tr,
                })}
              </span>
            </div>
            
            <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
              {comment.content}
            </p>
            
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleLikeComment(comment.id)}
                className={`flex items-center gap-1 text-sm transition-colors ${
                  isLiked
                    ? 'text-red-500'
                    : 'text-slate-500 hover:text-red-500'
                }`}
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
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Reply Form */}
            <AnimatePresence>
              {replyingTo === comment.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <div className="flex gap-2">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      className="min-h-[80px] resize-none"
                    />
                    <Button
                      onClick={() => handleSubmitComment(comment.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      size="sm"
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Replies */}
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

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-indigo-600" />
        Yorumlar ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
      </h3>

      {/* Comment Form */}
      {user ? (
        <div className="mb-6">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-500 text-white">
                {(profile?.full_name || profile?.username || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Düşüncelerinizi paylaşın..."
                className="min-h-[100px] resize-none mb-3"
              />
              <Button
                onClick={() => handleSubmitComment()}
                disabled={isSubmitting || !newComment.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Yorum Yap
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Yorum yapmak için{' '}
            <Link to="/giris" className="text-indigo-600 hover:underline font-medium">
              giriş yapın
            </Link>{' '}
            veya{' '}
            <Link to="/kayit" className="text-indigo-600 hover:underline font-medium">
              kayıt olun
            </Link>
            .
          </p>
        </div>
      )}

      {/* Comments List */}
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
