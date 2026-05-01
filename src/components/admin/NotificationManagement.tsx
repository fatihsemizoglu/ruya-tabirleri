import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/client';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  MessageSquare,
  Mail,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'comment' | 'message';
  title: string;
  description: string | null;
  link: string | null;
  is_active: boolean;
  is_read: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

const typeOptions = [
  { value: 'info', label: 'Bilgi', icon: Info, color: 'text-blue-500' },
  { value: 'warning', label: 'Uyarı', icon: AlertTriangle, color: 'text-yellow-500' },
  { value: 'success', label: 'Başarılı', icon: CheckCircle, color: 'text-green-500' },
  { value: 'error', label: 'Hata', icon: AlertCircle, color: 'text-red-500' },
  { value: 'comment', label: 'Yorum', icon: MessageSquare, color: 'text-orange-500' },
  { value: 'message', label: 'Mesaj', icon: Mail, color: 'text-purple-500' },
];

export function NotificationManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    type: 'info' as 'info' | 'warning' | 'success' | 'error' | 'comment' | 'message',
    title: '',
    description: '',
    link: '',
    is_active: true,
    display_order: 0,
    expires_at: '',
  });

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: queryKeys.admin.notifications,
    queryFn: () => adminApi.getNotifications({ limit: 100 }),
  });

  const notifications = notificationsData?.data || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      adminApi.updateNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications });
      setIsDialogOpen(false);
      setEditingNotification(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.notifications });
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'info',
      title: '',
      description: '',
      link: '',
      is_active: true,
      display_order: 0,
      expires_at: '',
    });
  };

  const handleOpenCreate = () => {
    setEditingNotification(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      type: notification.type,
      title: notification.title,
      description: notification.description || '',
      link: notification.link || '',
      is_active: notification.is_active,
      display_order: notification.display_order,
      expires_at: notification.expires_at ? notification.expires_at.split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      expires_at: formData.expires_at || undefined,
    };

    if (editingNotification) {
      updateMutation.mutate({ id: editingNotification.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getTypeIcon = (type: string) => {
    const option = typeOptions.find(t => t.value === type);
    if (option) {
      const Icon = option.icon;
      return <Icon className={`h-4 w-4 ${option.color}`} />;
    }
    return <Info className="h-4 w-4" />;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      comment: 'bg-orange-100 text-orange-800',
      message: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Bildirim Yönetimi
          </h2>
          <p className="text-muted-foreground">
            Admin panel bildirimlerini oluştur ve düzenle
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Bildirim
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? 'Bildirimi Düzenle' : 'Yeni Bildirim Oluştur'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Bildirim Tipi</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(option.value)}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Bildirim başlığı"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Bildirim açıklaması"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link (opsiyonel)</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="/admin?tab=..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="display_order">Sıralama</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Bitiş Tarihi</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingNotification ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bildirim</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Bildirim</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n: Notification) => n.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pasif Bildirim</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n: Notification) => !n.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Yükleniyor...</div>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Henüz bildirim yok</h3>
            <p className="text-sm text-muted-foreground mb-4">
              İlk bildiriminizi oluşturmak için yukarıdaki butona tıklayın.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: Notification) => (
            <Card key={notification.id} className={!notification.is_active ? 'opacity-60' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getTypeBadge(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{notification.title}</h4>
                      <Badge variant="outline" className={getTypeBadge(notification.type)}>
                        {typeOptions.find(t => t.value === notification.type)?.label}
                      </Badge>
                      {!notification.is_active && (
                        <Badge variant="secondary">Pasif</Badge>
                      )}
                    </div>
                    {notification.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.description.substring(0, 100)}
                        {notification.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Sıra: {notification.display_order}</span>
                      {notification.expires_at && (
                        <span>Bitiş: {format(new Date(notification.expires_at), 'dd MMM yyyy', { locale: tr })}</span>
                      )}
                      <span>Oluşturuldu: {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMutation.mutate(notification.id)}
                    disabled={toggleMutation.isPending}
                  >
                    {notification.is_active ? (
                      <ToggleRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(notification)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Bu bildirimi silmek istediğinize emin misiniz?')) {
                        deleteMutation.mutate(notification.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
