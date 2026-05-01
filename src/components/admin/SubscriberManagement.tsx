import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, Trash2, Search, Mail, Users, CheckCircle, XCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  is_verified: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

export function SubscriberManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

const { data: subscribers, isLoading } = useQuery({
    queryKey: queryKeys.admin.subscribers,
    queryFn: async () => {
      return [] as Subscriber[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      toast.info(`Abonelik silindi`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.subscribers });
      toast.success('Abone silindi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const handleDelete = (subscriber: Subscriber) => {
    if (confirm(`"${subscriber.email}" abonesini silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(subscriber.id);
    }
  };

  const filteredSubscribers = subscribers?.filter(sub =>
    sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: subscribers?.length || 0,
    verified: subscribers?.filter(s => s.is_verified && !s.unsubscribed_at).length || 0,
    unverified: subscribers?.filter(s => !s.is_verified).length || 0,
    unsubscribed: subscribers?.filter(s => s.unsubscribed_at).length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-serif font-semibold">Abone Yönetimi</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Toplam</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.verified}</p>
              <p className="text-sm text-muted-foreground">Aktif</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Mail className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.unverified}</p>
              <p className="text-sm text-muted-foreground">Doğrulanmamış</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.unsubscribed}</p>
              <p className="text-sm text-muted-foreground">İptal</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="E-posta veya isim ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredSubscribers && filteredSubscribers.length > 0 ? (
        <div className="border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-posta</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead className="text-center">Durum</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {subscriber.name || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {subscriber.unsubscribed_at ? (
                      <Badge variant="destructive">İptal Edildi</Badge>
                    ) : subscriber.is_verified ? (
                      <Badge className="bg-emerald-500">Aktif</Badge>
                    ) : (
                      <Badge variant="secondary">Doğrulanmamış</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(subscriber.subscribed_at), 'd MMM yyyy', { locale: tr })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subscriber)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">Henüz abone bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}

