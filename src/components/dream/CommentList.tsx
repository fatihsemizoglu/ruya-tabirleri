import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Heart, Trash2, MoreHorizontal, Flag, Reply, ChevronDown, ChevronUp, UserCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { Comment, Profile } from '@/types/database';

interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

// Yazar bilgisini tek bir noktadan uretir (uye veya misafir)
const getAuthorDisplay = (comment: CommentWithProfile) => {
  if (comment.profiles?.full_name) {
    return { name: comment.profiles.full_name, isGuest: false };
  }
  if (comment.profiles?.username) {
    return { name: comment.profiles.username, isGuest: false };
  }
  if (comment.guest_name) {
    return { name: comment.guest_name, isGuest: true };
  }
  return { name: 'Anonim Ziyaretçi', isGuest: true };
};

const getAuthorInitial = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
};

interface CommentListProps {
  comments: CommentWithProfile[];
  dreamId: string;
  onRefresh: () => void;
}

export function CommentList({ comments, dreamId, onRefresh }: CommentListProps) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [likeAnimations, setLikeAnimations] = useState<Set<string>>(new Set());
  const [showAllComments, setShowAllComments] = useState(false);

  // Fetch user's liked comments on mount
  useEffect(() => {
    const fetchLikedComments = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', comments.map(c => c.id));
      
      if (data) {
        setLikedComments(new Set(data.map(d => d.comment_id)));
      }
    };

    fetchLikedComments();
  }, [user, comments]);

  const likeMutation = useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('comment_likes').insert({
          comment_id: commentId,
          user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, { commentId, isLiked }) => {
      setLikedComments((prev) => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(commentId);
        } else {
          newSet.add(commentId);
        }
        return newSet;
      });
      onRefresh();
    },
    onError: () => {
      toast.error('Bir hata oluştu');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Yorum silindi');
      onRefresh();
    },
    onError: () => {
      toast.error('Yorum silinirken bir hata oluştu');
    },
  });

  const handleLike = (commentId: string) => {
    if (!user) {
      toast.error('Beğenmek için giriş yapmalısınız');
      return;
    }
    
    // Add animation
    setLikeAnimations(prev => new Set(prev).add(commentId));
    setTimeout(() => {
      setLikeAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }, 300);
    
    const isLiked = likedComments.has(commentId);
    likeMutation.mutate({ commentId, isLiked });
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (commentToDelete) {
      deleteMutation.mutate(commentToDelete);
    }
    setDeleteDialogOpen(false);
    setCommentToDelete(null);
  };

  const handleReport = (commentId: string) => {
    toast.success('Yorumunuz moderatörlerimize bildirildi');
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 5);
  const hasMoreComments = comments.length > 5;

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/30 rounded-xl">
        <p className="text-muted-foreground">
          Henüz yorum yapılmamış. İlk yorumu siz yapın!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {displayedComments.map((comment) => {
          const author = getAuthorDisplay(comment);
          const isOwner = user?.id === comment.user_id;
          const canDelete = isOwner || isAdmin;
          const isLiked = likedComments.has(comment.id);
          const isAnimating = likeAnimations.has(comment.id);

          return (
            <div 
              key={comment.id} 
              className="p-4 rounded-xl bg-muted/50 group transition-all duration-200 hover:bg-muted/70"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                    author.isGuest 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 text-amber-700 dark:text-amber-300'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {getAuthorInitial(author.name)}
                  </div>
                  <div>
                    <p className="font-medium flex items-center gap-1.5">
                      {author.name}
                      {author.isGuest && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-md font-normal">
                          Misafir
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canDelete && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(comment.id)}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Yorumu Sil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {user && !isOwner && (
                      <DropdownMenuItem
                        onClick={() => handleReport(comment.id)}
                        className="cursor-pointer"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Şikayet Et
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                {comment.content}
              </p>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(comment.id)}
                  disabled={likeMutation.isPending}
                  className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${
                    isLiked 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <Heart 
                    className={`w-4 h-4 transition-transform duration-200 ${isLiked ? 'fill-current' : ''} ${isAnimating ? 'scale-125' : 'scale-100'}`} 
                  />
                  <span>{comment.like_count || 0}</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Show More/Less Button */}
        {hasMoreComments && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllComments(!showAllComments)}
            className="w-full"
          >
            {showAllComments ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Daha az göster
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                {comments.length - 5} yorum daha göster
              </>
            )}
          </Button>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yorumu silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Yorum kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
