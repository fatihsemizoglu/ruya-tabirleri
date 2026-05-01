import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { NotificationCenter } from './NotificationCenter';
import { Shield, Menu, User, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-950 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>
          <motion.div
            className="h-2 w-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mx-auto"
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <p className="text-slate-400 mt-4 text-sm">Admin paneli yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-950 flex items-center justify-center p-4">
        <motion.div 
          className="text-center max-w-md mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-xl border border-red-500/20 flex items-center justify-center mx-auto mb-8"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="h-10 w-10 text-red-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-3">Erişim Engellendi</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">Bu sayfaya erişim yetkiniz bulunmuyor. Admin yetkisi gereklidir.</p>
          <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl px-8 h-12 shadow-lg shadow-indigo-500/25">
            <a href="/">Ana Sayfaya Dön</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Aurora Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] bg-gradient-to-br from-indigo-500/5 via-purple-500/3 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[20%] w-[60%] h-[60%] bg-gradient-to-tr from-blue-500/5 via-cyan-500/3 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        className={cn(
          "fixed inset-y-0 left-0 z-40",
          "lg:translate-x-0"
        )}
        initial={false}
        animate={{ 
          x: mobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -300 : 0)
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            onTabChange(tab);
            setMobileOpen(false);
          }}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
        />
      </motion.div>

      {/* Main Content */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-500 ease-out relative",
          collapsed ? "lg:pl-[90px]" : "lg:pl-[290px]"
        )}
      >
        {/* Premium Header */}
        <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="h-16 flex items-center justify-between px-4 lg:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400 dark:text-slate-500">Admin</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                <div>
                  <motion.h1 
                    key={title}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-base font-semibold text-slate-800 dark:text-white"
                  >
                    {title}
                  </motion.h1>
                </div>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50">
                <Search className="h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  className="bg-transparent text-sm text-slate-600 dark:text-slate-300 placeholder:text-slate-400 outline-none w-40"
                />
                <kbd className="hidden lg:inline-flex h-5 px-1.5 items-center rounded border border-slate-300 dark:border-slate-600 text-[10px] text-slate-400 font-mono">⌘K</kbd>
              </div>

              {/* Notifications */}
              <NotificationCenter />
              
              {/* User */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200/50 dark:border-slate-700/50">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{profile?.full_name || profile?.username || 'Admin'}</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <motion.span 
                      className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Çevrimiçi</span>
                  </div>
                </div>
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || <User className="h-5 w-5" />}
                </motion.div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with Animation */}
        <motion.div 
          className="p-4 lg:p-8"
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
