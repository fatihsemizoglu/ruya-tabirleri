import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldCheck,
  User,
  Calendar,
  MoreVertical,
  RefreshCw,
  Crown,
  UserCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { AppRole } from '@/types/database';
import { SkeletonAdminRow } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { AdminPageHeader } from './common/AdminPageHeader';
import { AdminStatsCards } from './common/AdminStatsCards';
import { useAuth } from '@/hooks/useAuth';

interface UserWithRole {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  email?: string;
  role?: AppRole;
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editingRole, setEditingRole] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [{ data: profilesData, error: profilesError }, { data: rolesData, error: rolesError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id, role'),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;

      const rolesMap = new Map(
        (rolesData || []).map(r => [r.user_id, r.role])
      );

      const usersWithRoles = (profilesData || []).map(profile => ({
        ...profile,
        role: rolesMap.get(profile.user_id) || ('user' as AppRole),
      }));

      setUsers(usersWithRoles as unknown as UserWithRole[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    const targetUser = users.find((u) => u.user_id === userId);
    const previousRole = targetUser?.role || 'user';
    if (previousRole === newRole) {
      setEditingRole(false);
      return;
    }

    if (currentUser?.id === userId && previousRole === 'admin' && newRole !== 'admin') {
      toast.error('Kendi admin yetkinizi düşüremezsiniz');
      return;
    }

    if (previousRole === 'admin' && newRole !== 'admin' && adminCount <= 1) {
      toast.error('Son admin kullanıcının yetkisi düşürülemez');
      return;
    }

    const label = targetUser?.full_name || targetUser?.username || 'bu kullanıcı';
    const confirmed = window.confirm(`${label} rolü ${previousRole} -> ${newRole} olarak değiştirilecek. Onaylıyor musunuz?`);
    if (!confirmed) return;

    try {
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingRole) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      
      if (selectedUser?.user_id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }

      await supabase.rpc('log_admin_action', {
        _action: 'role_change',
        _entity_type: 'user_role',
        _entity_title: label,
        _details: {
          target_user_id: userId,
          previous_role: previousRole,
          new_role: newRole,
        },
      });

      toast.success('Kullanıcı rolü güncellendi');
      setEditingRole(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Rol güncellenirken hata oluştu');
    }
  };

  const getRoleBadge = (role: AppRole | undefined) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-none font-bold py-0.5 px-2 rounded-md"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-none font-bold py-0.5 px-2 rounded-md"><ShieldCheck className="h-3 w-3 mr-1" />Moderatör</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground border-none font-bold py-0.5 px-2 rounded-md"><User className="h-3 w-3 mr-1" />Kullanıcı</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesFilter;
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const moderatorCount = users.filter(u => u.role === 'moderator').length;
  const userCount = users.filter(u => u.role === 'user' || !u.role).length;

  const statsData: [
    { label: string; value: number; subtext: string; icon: typeof Users },
    { label: string; value: number; subtext: string; icon: typeof Crown },
    { label: string; value: number; subtext: string; icon: typeof ShieldCheck }
  ] = [
    { label: 'Toplam Kullanıcı', value: users.length, subtext: 'Kayıtlı hesaplar', icon: Users },
    { label: 'Sistem Yöneticisi', value: adminCount, subtext: 'Tam yetkili yöneticiler', icon: Crown },
    { label: 'Moderatör', value: moderatorCount, subtext: 'Denetleme yetkilileri', icon: ShieldCheck }
  ];

  const canAssignRole = (target: UserWithRole, newRole: AppRole) => {
    const previousRole = target.role || 'user';
    if (previousRole === newRole) return true;
    if (currentUser?.id === target.user_id && previousRole === 'admin' && newRole !== 'admin') return false;
    if (previousRole === 'admin' && newRole !== 'admin' && adminCount <= 1) return false;
    return true;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Kullanıcı Yönetimi"
          description="Sistem kullanıcılarını, moderatörleri ve yetkilerini yönetin"
          icon={Users}
        />
        <SkeletonAdminRow count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kullanıcı Yönetimi"
        description="Sistem kullanıcılarını, moderatörleri ve yetkilerini yönetin"
        icon={Users}
        badge={`${adminCount} Yönetici`}
        action={
          <Button
            onClick={fetchUsers}
            className="bg-white hover:bg-white/90 text-indigo-900 rounded-xl px-4 py-2 font-bold shadow-sm flex items-center gap-2 text-sm border border-slate-200/10"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </Button>
        }
      />

      <AdminStatsCards stats={statsData} />

      {/* List Container */}
      <div className="admin-panel-surface p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-850 dark:text-white">Kullanıcı Listesi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              {filteredUsers.length} kullanıcı ({filteredUsers.length > 0 ? `1-${filteredUsers.length}` : '0-0'} gösteriliyor)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="İsim veya kullanıcı adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-filter-surface pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | AppRole)}>
            <SelectTrigger className="admin-filter-surface w-[180px] font-semibold text-xs md:text-sm">
              <SelectValue placeholder="Rol Filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Roller</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderatör</SelectItem>
              <SelectItem value="user">Kullanıcı</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-card border border-border/40 rounded-2xl">
            <EmptyState
              icon="users"
              title="Kullanıcı bulunamadı"
              description="Arama kriterlerine uygun kullanıcı bulunamadı."
              action={searchTerm ? { label: 'Aramayı Temizle', onClick: () => setSearchTerm('') } : undefined}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="admin-list-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0 text-sm">
                    {user.full_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-800 dark:text-white">
                        {user.full_name || 'İsimsiz Kullanıcı'}
                      </span>
                      {user.username && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          @{user.username}
                        </span>
                      )}
                      <div className="ml-1">
                        {getRoleBadge(user.role)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Kayıt: {format(new Date(user.created_at), 'd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => setSelectedUser(user)} className="rounded-lg text-xs font-semibold">
                        <User className="h-4 w-4 mr-2" />
                        Profili Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedUser(user);
                          setEditingRole(true);
                        }}
                        className="rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Rol Değiştir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser && !editingRole} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Kullanıcı Detayları</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {selectedUser.full_name?.charAt(0).toUpperCase() || selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedUser.full_name || 'İsimsiz'}
                  </h3>
                  {selectedUser.username && (
                    <p className="text-sm text-slate-500">@{selectedUser.username}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Rol</p>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase tracking-wider">Kayıt Tarihi</p>
                  <p className="font-semibold text-sm text-slate-800 dark:text-white">
                    {format(new Date(selectedUser.created_at), 'd MMMM yyyy', { locale: tr })}
                  </p>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Biyografi</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{selectedUser.bio}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  className="rounded-xl font-bold text-xs"
                  onClick={() => {
                    setEditingRole(true);
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Rol Değiştir
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-xl font-bold text-xs"
                  onClick={() => setSelectedUser(null)}
                >
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Edit Dialog */}
      <Dialog open={editingRole} onOpenChange={() => setEditingRole(false)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Kullanıcı Rolünü Değiştir</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/20 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {selectedUser.full_name?.charAt(0).toUpperCase() || selectedUser.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedUser.full_name || selectedUser.username || 'İsimsiz'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <span>Mevcut Yetki:</span>
                    {getRoleBadge(selectedUser.role)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yeni Rol Seçin:</p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={selectedUser.role === 'user' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4 rounded-xl font-semibold border-slate-200/60 dark:border-slate-855"
                    disabled={!canAssignRole(selectedUser, 'user')}
                    onClick={() => updateUserRole(selectedUser.user_id, 'user')}
                  >
                    <User className="h-5 w-5" />
                    <span>Kullanıcı</span>
                  </Button>
                  <Button
                    variant={selectedUser.role === 'moderator' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4 rounded-xl font-semibold border-slate-200/60 dark:border-slate-855"
                    disabled={!canAssignRole(selectedUser, 'moderator')}
                    onClick={() => updateUserRole(selectedUser.user_id, 'moderator')}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span>Moderatör</span>
                  </Button>
                  <Button
                    variant={selectedUser.role === 'admin' ? 'default' : 'outline'}
                    className="flex flex-col items-center gap-2 h-auto py-4 rounded-xl font-semibold border-slate-200/60 dark:border-slate-855"
                    onClick={() => updateUserRole(selectedUser.user_id, 'admin')}
                  >
                    <Crown className="h-5 w-5" />
                    <span>Admin</span>
                  </Button>
                </div>
                {selectedUser.role === 'admin' && adminCount <= 1 && (
                  <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-medium text-amber-700 dark:text-amber-300">
                    Bu kullanıcı son admin olduğu için admin yetkisi düşürülemez.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserManagement;
