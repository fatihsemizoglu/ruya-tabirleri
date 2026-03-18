import { useState, useMemo } from 'react';
import { MessageCircle, SortAsc, SortDesc, Clock, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import type { Comment, Profile } from '@/types/database';

interface CommentWithProfile extends Comment {
  profiles?: Profile;
}

interface CommentSectionProps {
  dreamId: string;
  comments: CommentWithProfile[];
  isLoading: boolean;
  onRefresh: () => void;
}

type SortOption = 'newest' | 'oldest' | 'popular';

export function CommentSection({ dreamId, comments, isLoading, onRefresh }: CommentSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'popular':
        sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
    }
    
    return sorted;
  }, [comments, sortBy]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-serif font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Yorumlar
          <Badge variant="secondary" className="ml-1 font-normal">
            {comments.length}
          </Badge>
        </h3>
        
        {comments.length > 1 && (
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sıralama" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  En Yeni
                </span>
              </SelectItem>
              <SelectItem value="oldest">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 rotate-180" />
                  En Eski
                </span>
              </SelectItem>
              <SelectItem value="popular">
                <span className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  En Beğenilen
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Comment Form */}
      <CommentForm 
        dreamId={dreamId} 
        onSuccess={onRefresh} 
      />
      
      {/* Comments List */}
      <CommentList 
        comments={sortedComments} 
        dreamId={dreamId}
        onRefresh={onRefresh}
      />
    </div>
  );
}
