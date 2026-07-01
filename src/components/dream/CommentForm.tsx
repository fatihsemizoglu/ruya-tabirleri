import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { Loader2, Send, UserCircle2, Mail, Info } from 'lucide-react';
import { getFirstValidationMessage, guestCommentSchema, memberCommentSchema } from '@/lib/validation/forms';

interface CommentFormProps {
  dreamId: string;
  onSuccess?: () => void;
}

export function CommentForm({ dreamId, onSuccess }: CommentFormProps) {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const queryClient = useQueryClient();
  const isApproved = !settings.requireApproval;

  // Guest state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  // Member state
  const [content, setContent] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (user) {
        // Üye yorumu
        const v = memberCommentSchema.safeParse({ content });
        if (!v.success) throw new Error(getFirstValidationMessage(v.error));
        const { error } = await supabase.from('comments').insert({
          dream_id: dreamId,
          user_id: user.id,
          content: v.data.content,
          is_approved: isApproved,
        });
        if (error) throw error;
      } else {
        // Guest yorumu
        const v = guestCommentSchema.safeParse({ name, email, content });
        if (!v.success) throw new Error(getFirstValidationMessage(v.error));
        const { error } = await supabase.from('comments').insert({
          dream_id: dreamId,
          user_id: null,
          guest_name: v.data.name,
          guest_email: v.data.email,
          content: v.data.content,
          is_approved: isApproved,
        } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setContent('');
      setName('');
      setEmail('');
      toast.success(
        settings.requireApproval
          ? 'Yorumunuz alındı, onaylandıktan sonra yayınlanacak'
          : 'Yorumunuz başarıyla eklendi'
      );
      queryClient.invalidateQueries({ queryKey: ['dream-comments', dreamId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Yorum eklenirken bir hata oluştu');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && (!name.trim() || !email.trim() || content.trim().length < 10)) return;
    if (user && content.trim().length < 10) return;
    mutation.mutate();
  };

  const charCount = content.length;
  const minChars = 10;
  const canSubmit = user
    ? charCount >= minChars
    : guestCommentSchema.safeParse({ name, email, content }).success;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Guest için Ad Soyad + Email */}
      {!user && (
        <div className="p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300">
            <Info className="h-3.5 w-3.5" />
            Yorum yapmak için üye olmak zorunda değilsiniz. Sadece adınız ve e-postanız yeterli.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="guest-name" className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <UserCircle2 className="h-3.5 w-3.5" />
                Ad Soyad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guest-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız Soyadınız"
                maxLength={100}
                className="bg-background"
                required
              />
            </div>
            <div>
              <Label htmlFor="guest-email" className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                E-posta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guest-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                maxLength={200}
                className="bg-background"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* Yorum alanı (herkes için) */}
      <Textarea
        placeholder={user ? 'Yorumunuzu yazın...' : 'Düşüncelerinizi yazın...'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={1000}
        className="resize-none"
        required
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {charCount}/1000 karakter {charCount < minChars && `(en az ${minChars})`}
        </span>
        <Button
          type="submit"
          disabled={mutation.isPending || !canSubmit}
        >
          {mutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {user ? 'Yorum Yap' : 'Misafir Olarak Yorum Yap'}
        </Button>
      </div>
    </form>
  );
}
