import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dreamsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string()
    .trim()
    .min(10, 'Yorum en az 10 karakter olmalıdır')
    .max(1000, 'Yorum en fazla 1000 karakter olabilir'),
});

interface CommentFormProps {
  dreamId: string;
  onSuccess?: () => void;
}

export function CommentForm({ dreamId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (commentContent: string) => {
      const validation = commentSchema.safeParse({ content: commentContent });
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const response = await dreamsApi.addComment(dreamId, validation.data.content);
      if (!response.success) {
        throw new Error(response.error || 'Yorum eklenirken bir hata oluştu');
      }
    },
    onSuccess: () => {
      setContent('');
      toast.success('Yorumunuz başarıyla eklendi');
      queryClient.invalidateQueries({ queryKey: ['dream-comments', dreamId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Yorum eklenirken bir hata oluştu');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate(content);
  };

  if (!user) {
    return (
      <div className="p-6 rounded-xl bg-muted/50 text-center">
        <p className="text-muted-foreground mb-4">
          Yorum yapabilmek için giriş yapmalısınız.
        </p>
        <Button asChild>
          <Link to="/giris">Giriş Yap</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder="Yorumunuzu yazın..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={1000}
        className="resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/1000 karakter
        </span>
        <Button 
          type="submit" 
          disabled={mutation.isPending || content.trim().length < 10}
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Yorum Yap
        </Button>
      </div>
    </form>
  );
}
