import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Bell, 
  MessageSquare, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  X,
  ExternalLink,
  Settings
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
import { adminApi } from '@/lib/api';

interface Notification {
  id: string;
  type: 'message' | 'comment' | 'system';
  title: string;
  description: string;
  time: Date;
  read: boolean;
  link?: string;
}

// Mock notifications for placeholder
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'comment',
    title: 'Onay bekleyen yorum',
    description: 'Rüya tabiri hakkında yeni bir yorum var...',
    time: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    link: '/admin?tab=comments',
  },
  {
    id: '2',
    type: 'message',
    title: 'Yeni mesaj: Mehmet K.',
    description: 'Web siteniz hakkında bilgi almak istiyorum...',
    time: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
    link: '/admin?tab=messages',
  },
  {
    id: '3',
    type: 'comment',
    title: 'Onay bekleyen yorum',
    description: 'Çok güzel bir açıklama olmuş...',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    link: '/admin?tab=comments',
  },
];

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch pending comments
  const { data: pendingComments } = useQuery({
    queryKey: ['admin-pending-comments'],
    queryFn: async () => {
      const response = await adminApi.getComments({ status: 'pending', limit: 10 });
      return response.data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch unread messages
  const { data: unreadMessages } = useQuery({
    queryKey: ['admin-unread-messages'],
    queryFn: async () => {
      const response = await adminApi.getContactMessages({ limit: 10 });
      // Filter unread messages if available
      const messages = response.data?.messages || [];
      return messages.filter((m: any) => !m.is_read);
    },
    refetchInterval: 30000,
  });

  // Fetch custom admin notifications
  const { data: customNotifications } = useQuery({
    queryKey: ['admin-custom-notifications'],
    queryFn: async () => {
      const response = await adminApi.getActiveNotifications();
      return response.data || [];
    },
    refetchInterval: 60000,
  });

  // Build notifications list
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Add comment notifications
    if (pendingComments && pendingComments.length > 0) {
      pendingComments.forEach((comment: any) => {
        newNotifications.push({
          id: `comment-${comment.id}`,
          type: 'comment',
          title: 'Onay bekleyen yorum',
          description: (comment.content || 'Yeni yorum').substring(0, 50) + ((comment.content?.length || 0) > 50 ? '...' : ''),
          time: new Date(comment.created_at || Date.now()),
          read: false,
          link: '/admin?tab=comments',
        });
      });
    }

    // Add message notifications
    if (unreadMessages && unreadMessages.length > 0) {
      unreadMessages.forEach((msg: any) => {
        newNotifications.push({
          id: `msg-${msg.id}`,
          type: 'message',
          title: `Yeni mesaj: ${msg.name || 'Kullanıcı'}`,
          description: msg.subject || msg.message?.substring(0, 50) || 'Yeni mesaj',
          time: new Date(msg.created_at || Date.now()),
          read: false,
          link: '/admin?tab=messages',
        });
      });
    }

    // Add custom admin notifications
    if (customNotifications && customNotifications.length > 0) {
      customNotifications.forEach((notification: any) => {
        newNotifications.push({
          id: `custom-${notification.id}`,
          type: notification.type || 'info',
          title: notification.title,
          description: notification.description || '',
          time: new Date(notification.created_at || Date.now()),
          read: notification.is_read || false,
          link: notification.link || undefined,
        });
      });
    }

    // Sort by time
    newNotifications.sort((a, b) => b.time.getTime() - a.time.getTime());

    // Use mock data if no real notifications
    setNotifications(newNotifications.length > 0 ? newNotifications : mockNotifications);
  }, [pendingComments, unreadMessages, customNotifications]);

  const totalUnread = notifications.filter(n => !n.read).length;

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
        
        {/* Manage Notifications Button */}
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setIsOpen(false);
              navigate('/admin?tab=notifications');
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Bildirimleri Yönet
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
