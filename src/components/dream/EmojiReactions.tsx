import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featuresApi } from '@/lib/api/features';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

const REACTION_EMOJIS = ['❤️', '👍', '😊', '🤔', '💡', '🌙', '✨', '🔮'];

export function EmojiReactions({ commentId }: { commentId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: response } = useQuery({
    queryKey: ['reactions', commentId],
    queryFn: () => featuresApi.getReactions(commentId),
  });

  const toggleMutation = useMutation({
    mutationFn: (emoji: string) => featuresApi.toggleReaction(commentId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', commentId] });
      setOpen(false);
    },
  });

  const reactions = response?.data || {};

  return (
    <div className="flex items-center flex-wrap gap-1.5">
      {Object.entries(reactions).map(([emoji, data]: [string, any]) => {
        const isActive = user && data.userIds?.includes(user.id);
        return (
          <Button
            key={emoji}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={`h-7 px-2 gap-1 text-xs ${isActive ? 'bg-primary/20 border-primary' : ''}`}
            onClick={() => user && toggleMutation.mutate(emoji)}
            disabled={!user}
          >
            <span>{emoji}</span>
            <span>{data.count}</span>
          </Button>
        );
      })}

      {user && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <SmilePlus className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1">
              {REACTION_EMOJIS.map(emoji => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                  onClick={() => toggleMutation.mutate(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
