import { useState, useEffect } from 'react';
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
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case 'comment':
        return 'bg-orange-100 dark:bg-orange-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
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
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    !notification.read 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'hover:bg-muted/50'
                  }`}
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
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 h-auto mt-2"
                          onClick={() => {
                            setIsOpen(false);
                            // Navigate programmatically if needed
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Görüntüle
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
