import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/features';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Bell, Check, CheckCheck, Trash2, MessageSquare, Heart, BookOpen, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const iconMap: Record<string, any> = {
  comment: MessageSquare,
  like: Heart,
  new_dream: BookOpen,
  trending: TrendingUp,
};

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: countResponse } = useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: notifResponse } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll(1, 10),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const unreadCount = countResponse?.count || 0;
  const notifications = notifResponse?.data || [];

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <h4 className="font-semibold">Bildirimler</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs h-7"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Tümünü okundu işaretle
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Bildirim yok
            </div>
          ) : (
            notifications.map((notif: any) => {
              const Icon = iconMap[notif.type] || Bell;
              return (
                <DropdownMenuItem
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 cursor-pointer ${!notif.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    if (!notif.is_read) markReadMutation.mutate(notif.id);
                    if (notif.link) window.location.href = notif.link;
                  }}
                >
                  <div className={`mt-0.5 p-1.5 rounded-full ${!notif.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold' : ''}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: tr })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
