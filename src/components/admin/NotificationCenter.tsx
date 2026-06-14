import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'message' | 'comment' | 'system';
  title: string;
  description: string;
  time: Date;
  read: boolean;
  link?: string;
}

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch unread messages
  const { data: unreadMessages } = useQuery({
    queryKey: ['admin-unread-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('id, name, subject, created_at')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
      refetchInterval: 30000, // Refresh every 30 seconds
      staleTime: 15000,
    });

  // Fetch pending comments
  const { data: pendingComments } = useQuery({
    queryKey: ['admin-pending-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, created_at, dreams(title)')
        .eq('is_approved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Build notifications list
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Add message notifications
    unreadMessages?.forEach(msg => {
      newNotifications.push({
        id: `msg-${msg.id}`,
        type: 'message',
        title: `Yeni mesaj: ${msg.name}`,
        description: msg.subject,
        time: new Date(msg.created_at),
        read: false,
        link: '/admin?tab=messages',
      });
    });

    // Add comment notifications
    pendingComments?.forEach(comment => {
      newNotifications.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        title: 'Onay bekleyen yorum',
        description: comment.content.substring(0, 50) + (comment.content.length > 50 ? '...' : ''),
        time: new Date(comment.created_at),
        read: false,
        link: '/admin?tab=comments',
      });
    });

    // Sort by time
    newNotifications.sort((a, b) => b.time.getTime() - a.time.getTime());
    setNotifications(newNotifications);
  }, [unreadMessages, pendingComments]);

  const totalUnread = (unreadMessages?.length || 0) + (pendingComments?.length || 0);

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-sky-100 dark:bg-sky-950/50';
      case 'comment':
        return 'bg-amber-100 dark:bg-amber-950/50';
      default:
        return 'bg-muted';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setIsOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Admin bildirimleri">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs shadow-sm"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[calc(100vw-1.5rem)] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirimler
            {totalUnread > 0 && (
              <Badge variant="secondary">{totalUnread} yeni</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="font-semibold mb-2">Tümü okundu!</h3>
              <p className="text-sm text-muted-foreground">
                Yeni bildirim bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 rounded-lg border transition-colors ${
                    !notification.read 
                      ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                      : 'hover:bg-muted/50'
                  } w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm truncate">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(notification.time, { 
                            addSuffix: true, 
                            locale: tr 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                      {notification.link && (
                        <span className="mt-2 inline-flex items-center text-xs font-medium text-primary">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Görüntüle
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
