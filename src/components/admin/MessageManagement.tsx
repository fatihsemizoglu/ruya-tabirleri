import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { captureError } from '@/lib/logger';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function MessageManagement() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages((data || []) as ContactMessage[]);
    } catch (error) {
      captureError(error, { tags: { feature: 'message-management' }, extra: { context: 'fetch-messages' } });
      toast.error('Mesajlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const toggleReadStatus = async (message: ContactMessage) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ is_read: !message.is_read })
        .eq('id', message.id);

      if (error) throw error;

      setMessages(messages.map(m => 
        m.id === message.id ? { ...m, is_read: !m.is_read } : m
      ));
      
      toast.success(message.is_read ? 'Okunmadı olarak işaretlendi' : 'Okundu olarak işaretlendi');
    } catch (error) {
      captureError(error, { tags: { feature: 'message-management' }, extra: { context: 'update-message' } });
      toast.error('İşlem başarısız');
    }
  };

  const deleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageToDelete.id);

      if (error) throw error;

      setMessages(messages.filter(m => m.id !== messageToDelete.id));
      setMessageToDelete(null);
      toast.success('Mesaj silindi');
    } catch (error) {
      captureError(error, { tags: { feature: 'message-management' }, extra: { context: 'delete-message' } });
      toast.error('Silme işlemi başarısız');
    }
  };

  const openMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    
    if (!message.is_read) {
      try {
        await supabase
          .from('contact_messages')
          .update({ is_read: true })
          .eq('id', message.id);

        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, is_read: true } : m
        ));
      } catch (error) {
        captureError(error, { tags: { feature: 'message-management' }, extra: { context: 'mark-as-read' } });
      }
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'unread' && !message.is_read) ||
      (filter === 'read' && message.is_read);

    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter(m => !m.is_read).length;

  const statsData: [
    { label: string; value: number; subtext: string; icon: typeof Inbox },
    { label: string; value: number; subtext: string; icon: typeof AlertCircle },
    { label: string; value: number; subtext: string; icon: typeof CheckCircle }
  ] = [
    { label: 'Toplam Mesaj', value: messages.length, subtext: 'Tüm gelen mesajlar', icon: Inbox },
    { label: 'Okunmamış', value: unreadCount, subtext: 'Okunmayı bekleyen', icon: AlertCircle },
    { label: 'Okunmuş', value: messages.length - unreadCount, subtext: 'Okunan mesajlar', icon: CheckCircle }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Mesaj Yönetimi"
          description="İletişim formundan gelen ziyaretçi mesajlarını okuyun ve yönetin"
          icon={Mail}
        />
        <SkeletonAdminRow count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Mesaj Yönetimi"
        description="İletişim formundan gelen ziyaretçi mesajlarını okuyun ve yönetin"
        icon={Mail}
        badge={unreadCount > 0 ? `${unreadCount} Yeni Mesaj` : undefined}
        action={
          <Button
            onClick={fetchMessages}
            className="bg-white hover:bg-white/90 text-indigo-900 rounded-xl px-4 py-2 font-bold shadow-sm flex items-center gap-2 text-sm border border-slate-200/10"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </Button>
        }
      />

      <AdminStatsCards stats={statsData} />

      {/* Messages List Wrapper */}
      <div className="admin-panel-surface p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Gelen Mesajlar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {filteredMessages.length} mesaj ({filteredMessages.length > 0 ? `1-${filteredMessages.length}` : '0-0'} gösteriliyor)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim, email veya konu ara..."
              aria-label="İsim, email veya konu ara"
              className="admin-filter-surface"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              className="rounded-xl px-4 text-xs font-semibold"
              onClick={() => setFilter('all')}
            >
              Tümü
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              className="rounded-xl px-4 text-xs font-semibold"
              onClick={() => setFilter('unread')}
            >
              Okunmamış
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              className="rounded-xl px-4 text-xs font-semibold"
              onClick={() => setFilter('read')}
            >
              Okunmuş
            </Button>
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-2xl">
            <EmptyState
              icon="mail"
              title="Mesaj bulunamadı"
              description={
                searchTerm || filter !== 'all'
                  ? 'Arama kriterlerine uygun mesaj yok.'
                  : 'Henüz iletişim mesajı gelmemiş.'
              }
              action={
                searchTerm
                  ? { label: 'Aramayı Temizle', onClick: () => setSearchTerm('') }
                  : filter !== 'all'
                  ? { label: 'Tüm Mesajları Göster', onClick: () => setFilter('all') }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openMessage(message);
                  }
                }}
                className={`admin-list-surface p-5 flex flex-col sm:flex-row justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  !message.is_read ? 'bg-blue-500/10 border-blue-500/35' : ''
                }`}
                onClick={() => openMessage(message)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    !message.is_read 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-semibold text-sm ${!message.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {message.name}
                      </span>
                      {!message.is_read && (
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15 border-none text-[10px] font-bold py-0.5 px-2 rounded-md">
                          Yeni
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">{message.email}</p>
                    <p className={`font-semibold text-sm mb-1 line-clamp-1 ${!message.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {message.subject}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{message.message}</p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(message.created_at), 'dd MMM yyyy', { locale: tr })}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label={message.is_read ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReadStatus(message);
                      }}
                    >
                      {message.is_read ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="Mesajı sil"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageToDelete(message);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedMessage.name}</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm text-indigo-600 hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                <div className="ml-auto text-xs text-slate-400">
                  {format(new Date(selectedMessage.created_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                </div>
              </div>
              <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/40 dark:border-slate-850/20 rounded-xl min-h-[150px] leading-relaxed">
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{selectedMessage.message}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
                <Button variant="outline" asChild className="rounded-xl text-xs font-semibold">
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Yanıtla
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl text-xs font-semibold"
                  onClick={() => {
                    setSelectedMessage(null);
                    setMessageToDelete(selectedMessage);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!messageToDelete} onOpenChange={() => setMessageToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Mesajı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. "{messageToDelete?.subject}" konulu mesaj kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">İptal</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMessage} className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default MessageManagement;
