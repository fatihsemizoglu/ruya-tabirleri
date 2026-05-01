import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/features';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Trash2, Settings, MessageSquare, Heart, BookOpen, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const iconMap: Record<string, any> = {
  comment: MessageSquare,
  like: Heart,
  new_dream: BookOpen,
  trending: TrendingUp,
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['notifications-page', page],
    queryFn: () => notificationsApi.getAll(page, 20),
    enabled: !!user,
  });

  const { data: prefsResponse } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences(),
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-page'] }),
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: any) => notificationsApi.updatePreferences(prefs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
  });

  const notifications = response?.data || [];
  const total = response?.total || 0;
  const prefs = prefsResponse?.data || {};

  if (!user) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Bildirimler</h1>
          <p className="text-muted-foreground">Giriş yapmalısınız.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-3xl mx-auto">
        <h1 className="text-3xl font-serif font-bold flex items-center gap-3 mb-8">
          <Bell className="h-8 w-8 text-primary" />
          Bildirimler
        </h1>

        <Tabs defaultValue="all">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="settings">Ayarlar</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" onClick={() => markAllReadMutation.mutate()}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Tümünü okundu işaretle
            </Button>
          </div>

          <TabsContent value="all">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Henüz bildiriminiz yok.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif: any) => {
                  const Icon = iconMap[notif.type] || Bell;
                  return (
                    <Card key={notif.id} className={notif.is_read ? 'opacity-70' : ''}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`mt-0.5 p-2 rounded-full ${!notif.is_read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notif.is_read ? 'font-semibold' : ''}`}>
                            {notif.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: tr })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notif.is_read && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markReadMutation.mutate(notif.id)}>
                              <CheckCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(notif.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Bildirim Tercihleri
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'new_dream_notification', label: 'Yeni rüya bildirimi', desc: 'Takip ettiğiniz kategorilere yeni rüya eklendiğinde' },
                  { key: 'comment_notification', label: 'Yorum bildirimi', desc: 'Rüyanıza yorum yapıldığında' },
                  { key: 'daily_reminder', label: 'Günlük hatırlatıcı', desc: 'Her sabah rüya günlüğünüzü yazmanız için hatırlatma' },
                  { key: 'weekly_summary', label: 'Haftalık özet', desc: 'Haftalık rüya trendleri ve istatistikler' },
                  { key: 'email_notifications', label: 'E-posta bildirimleri', desc: 'Önemli bildirimlerin e-posta ile gönderilmesi' },
                  { key: 'push_notifications', label: 'Push bildirimleri', desc: 'Tarayıcı push bildirimleri' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label>{label}</Label>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={prefs[key] ?? false}
                      onCheckedChange={(checked) => updatePrefsMutation.mutate({ [key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
