import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mail, Search, Trash2, Eye, EyeOff, Clock, User, CheckCircle, AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.admin.messages.all,
    queryFn: async () => {
      const response = await adminApi.getContactMessages();
      if (!response.success) throw new Error(response.error || 'Failed to fetch messages');
      return response.data?.messages || [];
    },
  });

  const toggleRead = useMutation({
    mutationFn: (id: string) => adminApi.markMessageAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ContactMessage[]>(queryKeys.admin.messages.all, (old) =>
        old?.map(m => m.id === id ? { ...m, is_read: !m.is_read } : m)
      );
    },
  });

  const deleteMsg = useMutation({
    mutationFn: (id: string) => adminApi.deleteMessage(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<ContactMessage[]>(queryKeys.admin.messages.all, (old) =>
        old?.filter(m => m.id !== id)
      );
      setMessageToDelete(null);
      toast.success('Mesaj silindi');
    },
  });

  const openMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      await toggleRead.mutateAsync(message.id);
      queryClient.setQueryData<ContactMessage[]>(queryKeys.admin.messages.all, (old) =>
        old?.map(m => m.id === message.id ? { ...m, is_read: true } : m)
      );
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

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">Mesajlar yükleniyor...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{messages.length}</p>
            <p className="text-sm text-slate-500">Toplam Mesaj</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
            <p className="text-sm text-slate-500">Okunmamış</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{messages.length - unreadCount}</p>
            <p className="text-sm text-slate-500">Okunmuş</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="İsim, email veya konu ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Tümü
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Okunmamış
            </Button>
            <Button
              variant={filter === 'read' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('read')}
            >
              Okunmuş
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Messages List */}
      <Card className="overflow-hidden">
        {filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Mesaj bulunamadı</h3>
            <p className="text-slate-500">
              {searchTerm || filter !== 'all' ? 'Arama kriterlerine uygun mesaj yok.' : 'Henüz iletişim mesajı gelmemiş.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                  !message.is_read ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
                onClick={() => openMessage(message)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    !message.is_read 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${!message.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                        {message.name}
                      </span>
                      {!message.is_read && (
                        <Badge className="bg-blue-500 text-white text-xs">Yeni</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{message.email}</p>
                    <p className={`font-medium mb-1 ${!message.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {message.subject}
                    </p>
                    <p className="text-sm text-slate-500 line-clamp-1">{message.message}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(message.created_at), 'dd MMM', { locale: tr })}
                    </span>
<div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRead.mutate(message.id);
                        }}
                      >
                        {message.is_read ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
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
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <User className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{selectedMessage.name}</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-sm text-indigo-600 hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                <div className="ml-auto text-sm text-slate-500">
                  {format(new Date(selectedMessage.created_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                </div>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" asChild>
                  <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Yanıtla
                  </a>
                </Button>
                <Button
                  variant="destructive"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mesajı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. "{messageToDelete?.subject}" konulu mesaj kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={() => messageToDelete && deleteMsg.mutate(messageToDelete.id)} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

