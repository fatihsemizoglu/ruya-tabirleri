import { useQuery } from '@tanstack/react-query';
import { BookOpen, MessageSquare, User, Eye, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api';

interface ActivityItem {
  id: string;
  type: 'dream' | 'comment' | 'user';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

// Mock data for placeholder
const mockActivities: ActivityItem[] = [
  { id: '1', type: 'dream', title: 'Su Görmek', description: '15 görüntüleme, 3 beğeni', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), link: '/ruya/su-gormek' },
  { id: '2', type: 'user', title: 'ahmet_yilmaz', description: 'Yeni üye oldu', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: '3', type: 'comment', title: 'Ölmüş Anneyi Görmek', description: 'Çok güzel bir yorum...', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), link: '/ruya/olmus-anneyi-gormek' },
  { id: '4', type: 'dream', title: 'Para Bulmak', description: '42 görüntüleme, 8 beğeni', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), link: '/ruya/para-bulmak' },
  { id: '5', type: 'comment', title: 'Düğün Görmek', description: 'Harika açıklama olmuş...', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), link: '/ruya/dugun-gormek' },
];

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      // Fetch recent dreams and comments from admin API
      const [dreamsResponse, commentsResponse] = await Promise.all([
        adminApi.getTopDreams(5),
        adminApi.getComments({ status: 'all', limit: 5 }),
      ]);

      const activityItems: ActivityItem[] = [];

      // Add dreams
      if (dreamsResponse.data) {
        dreamsResponse.data.forEach((dream: any, index: number) => {
          activityItems.push({
            id: `dream-${dream.id || index}`,
            type: 'dream',
            title: dream.title || 'Rüya Tabiri',
            description: `${dream.view_count || 0} görüntüleme, ${dream.like_count || 0} beğeni`,
            timestamp: new Date(Date.now() - index * 1000 * 60 * 10).toISOString(),
            link: `/ruya/${dream.slug || 'unknown'}`,
          });
        });
      }

      // Add comments
      if (commentsResponse.data) {
        commentsResponse.data.forEach((comment: any, index: number) => {
          activityItems.push({
            id: `comment-${comment.id || index}`,
            type: 'comment',
            title: comment.dream_title || 'Rüya Tabiri',
            description: (comment.content || 'Yorum').slice(0, 50) + ((comment.content?.length || 0) > 50 ? '...' : ''),
            timestamp: new Date(Date.now() - (index + 5) * 1000 * 60 * 10).toISOString(),
            link: comment.dream_slug ? `/ruya/${comment.dream_slug}` : undefined,
          });
        });
      }

      // Sort by timestamp and take top 10
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Return API data or mock data if empty
      return activityItems.length > 0 ? activityItems.slice(0, 10) : mockActivities;
    },
  });

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'dream':
        return <BookOpen className="w-4 h-4 text-primary" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'user':
        return <User className="w-4 h-4 text-green-500" />;
    }
  };

  const getTypeLabel = (type: ActivityItem['type']) => {
    switch (type) {
      case 'dream':
        return 'Rüya';
      case 'comment':
        return 'Yorum';
      case 'user':
        return 'Kullanıcı';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Henüz aktivite bulunmuyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 group">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            {getIcon(activity.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                {getTypeLabel(activity.type)}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.timestamp), { 
                  addSuffix: true, 
                  locale: tr 
                })}
              </span>
            </div>
            {activity.link ? (
              <Link 
                to={activity.link}
                className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
              >
                {activity.title}
              </Link>
            ) : (
              <p className="font-medium text-sm line-clamp-1">{activity.title}</p>
            )}
            <p className="text-xs text-muted-foreground line-clamp-1">{activity.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
