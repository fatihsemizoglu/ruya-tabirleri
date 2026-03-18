import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { NotificationCenter } from './NotificationCenter';
import { Shield, Menu, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  description?: string;
}

export function AdminLayout({ children, activeTab, onTabChange, title, description }: AdminLayoutProps) {
  const { user, isAdmin, isLoading, profile } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erişim Engellendi</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor. Admin yetkisi gereklidir.</p>
          <Button asChild variant="outline">
            <a href="/">Ana Sayfaya Dön</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 transition-transform duration-300 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            onTabChange(tab);
            setMobileOpen(false);
          }}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      </div>

      {/* Main Content */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-300",
          collapsed ? "lg:pl-[90px]" : "lg:pl-[290px]"
        )}
      >
        {/* TailAdmin-style Header */}
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9 rounded-lg"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Page Title */}
            <div>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h1>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationCenter />
            
            {/* User Avatar */}
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{profile?.full_name || profile?.username || 'Admin'}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Çevrimiçi
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || <User className="h-5 w-5" />}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
