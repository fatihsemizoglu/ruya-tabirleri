import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';
import type { Profile, AppRole } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Shield, ShieldCheck, Crown, User, Calendar, MoreVertical, RefreshCw, UserCheck, Mail } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UserWithRole extends Profile {
  role?: AppRole;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900/50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bgColor)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </div>
    </div>
  );
}

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [editingRole, setEditingRole] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: async () => {
      const response = await fetchApi<UserWithRole[]>('/admin/users');
      if (!response.success) throw new Error(response.error || 'Failed to fetch users');
      return response.data || [];
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      fetchApi(`/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    onSuccess: (_, { userId, role }) => {
      queryClient.setQueryData<UserWithRole[]>(queryKeys.admin.users, (old) =>
        old?.map(u => u.user_id === userId ? { ...u, role } : u)
      );
      setEditingRole(false);
      toast.success('Kullanıcı rolü güncellendi');
    },
    onError: () => toast.error('Rol güncellenirken hata oluştu'),
  });

  const getRoleBadge = (role: AppRole | undefined) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"><Crown className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0"><ShieldCheck className="h-3 w-3 mr-1" />Moderatör</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0"><User className="h-3 w-3 mr-1" />Kullanıcı</Badge>;
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

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-white p-8 dark:bg-slate-900/50">
        <div className="flex items-center justify-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-slate-500">Kullanıcılar yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard 
          label="Toplam"
          value={users.length}
          icon={Users}
          color="text-indigo-600"
          bgColor="bg-indigo-100 dark:bg-indigo-900/30"
        />
        <StatCard 
          label="Admin"
          value={adminCount}
          icon={Crown}
          color="text-red-600"
          bgColor="bg-red-100 dark:bg-red-900/30"
        />
        <StatCard 
          label="Moderatör"
          value={moderatorCount}
          icon={ShieldCheck}
          color="text-amber-600"
          bgColor="bg-amber-100 dark:bg-amber-900/30"
        />
        <StatCard 
          label="Kullanıcı"
          value={userCount}
          icon={UserCheck}
          color="text-emerald-600"
          bgColor="bg-emerald-100 dark:bg-emerald-900/30"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border bg-white p-3 dark:bg-slate-900/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="İsim veya kullanıcı adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as 'all' | AppRole)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Rol Filtrele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Roller</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="moderator">Moderatör</SelectItem>
            <SelectItem value="user">Kullanıcı</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border bg-white overflow-hidden dark:bg-slate-900/50">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Kullanıcı bulunamadı</h3>
            <p className="text-xs text-slate-500">Arama kriterlerine uygun kullanıcı yok.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kullanıcı</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kayıt</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {user.full_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {user.full_name || user.username || 'İsimsiz'}
                          </p>
                          {user.username && (
                            <p className="text-xs text-slate-500">@{user.username}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {format(new Date(user.created_at), 'dd MMM yyyy', { locale: tr })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                            <User className="h-4 w-4 mr-2" />
                            Profil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedUser(user);
                              setEditingRole(true);
                            }}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Rol Değiştir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser && !editingRole} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kullanıcı Detayları</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-semibold">
                  {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedUser.full_name || selectedUser.username || 'İsimsiz'}
                  </h3>
                  {selectedUser.username && (
                    <p className="text-sm text-slate-500">@{selectedUser.username}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Rol:</span>
                  <span className="ml-auto">{getRoleBadge(selectedUser.role)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">Kayıt:</span>
                  <span className="ml-auto text-slate-900 dark:text-white">
                    {format(new Date(selectedUser.created_at), 'dd MMMM yyyy', { locale: tr })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-500">E-posta:</span>
                  <span className="ml-auto text-slate-900 dark:text-white truncate max-w-[150px]">
                    {selectedUser.email || '-'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editingRole} onOpenChange={setEditingRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rol Değiştir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {selectedUser && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {selectedUser.full_name || selectedUser.username || 'İsimsiz'}
                    </p>
                    <p className="text-xs text-slate-500">Mevcut: {getRoleBadge(selectedUser.role)}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Yeni Rol</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['user', 'moderator', 'admin'] as AppRole[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => selectedUser.user_id && updateRole.mutate({ userId: selectedUser.user_id, role })}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                          selectedUser.role === role 
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" 
                            : "border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                        )}
                      >
                        {role === 'admin' && <Crown className={cn("h-5 w-5", selectedUser.role === role ? "text-red-500" : "text-slate-400")} />}
                        {role === 'moderator' && <ShieldCheck className={cn("h-5 w-5", selectedUser.role === role ? "text-amber-500" : "text-slate-400")} />}
                        {role === 'user' && <User className={cn("h-5 w-5", selectedUser.role === role ? "text-emerald-500" : "text-slate-400")} />}
                        <span className={cn(
                          "text-xs font-medium capitalize",
                          selectedUser.role === role ? "text-slate-900 dark:text-white" : "text-slate-500"
                        )}>
                          {role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderatör' : 'Kullanıcı'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
