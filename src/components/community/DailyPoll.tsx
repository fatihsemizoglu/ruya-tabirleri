import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/lib/api/features';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, CheckCircle, Calendar } from 'lucide-react';

export function DailyPoll() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pollResponse, isLoading } = useQuery({
    queryKey: ['daily-poll'],
    queryFn: () => communityApi.getTodayPoll(),
    refetchInterval: 60000,
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) =>
      communityApi.vote(pollId, optionIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['daily-poll'] }),
  });

  const poll = pollResponse?.data;
  const userVote = pollResponse?.data?.userVote;
  const hasVoted = userVote !== null && userVote !== undefined;

  if (isLoading || !poll) return null;

  const totalVotes = poll.totalVotes || 1;

  return (
    <Card className="border-none shadow-md bg-gradient-to-br from-violet-500/10 to-purple-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-600" />
            Günlük Rüya Anketi
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(poll.poll_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{poll.question}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {poll.results?.map((r: any, i: number) => {
          const percent = Math.round((r.count / totalVotes) * 100);
          const isSelected = userVote === i;

          return (
            <div key={i}>
              {hasVoted ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={isSelected ? 'font-semibold text-primary' : ''}>
                      {isSelected && <CheckCircle className="inline h-4 w-4 mr-1" />}
                      {r.option}
                    </span>
                    <span className="text-muted-foreground">{percent}% ({r.count})</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-primary' : 'bg-violet-400'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full justify-start hover:bg-violet-500/10 hover:border-violet-300"
                  onClick={() => user && voteMutation.mutate({ pollId: poll.id, optionIndex: i })}
                  disabled={!user || voteMutation.isPending}
                >
                  {r.option}
                </Button>
              )}
            </div>
          );
        })}
        {!user && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Oy kullanmak için giriş yapın
          </p>
        )}
        {hasVoted && (
          <p className="text-xs text-center text-muted-foreground">
            Toplam {totalVotes} oy
          </p>
        )}
      </CardContent>
    </Card>
  );
}
