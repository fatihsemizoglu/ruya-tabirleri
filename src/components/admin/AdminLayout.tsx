import { ReactNode, useState, useEffect, memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';
import { NotificationCenter } from './NotificationCenter';
import { Shield, Menu, Activity, Settings, RotateCw, Clock, Sparkles } from 'lucide-react';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  title: string;
  description?: string;
  hideHeaderBanner?: boolean;
}

/** Isolated live clock to avoid re-rendering the entire layout every second */
const LiveClock = memo(function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <>{time}</>;
});

export function AdminLayout({ children, activeTab, onTabChange, title, description, hideHeaderBanner }: AdminLayoutProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6 border border-red-200 dark:border-red-900/30">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Erişim Engellendi</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Bu sayfaya erişim yetkiniz bulunmuyor. Admin yetkisi gereklidir.</p>
          <Button asChild variant="outline">
            <a href="/">Ana Sayfaya Dön</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative overflow-x-hidden">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] bg-violet-500/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 w-[520px] h-[520px] bg-fuchsia-500/8 rounded-full blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          tabIndex={-1}
        />
      )}

      {/* Sidebar - Hidden on mobile by default */}
      <div className={cn(
        "hidden lg:block",
        mobileOpen && "!block"
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
          "min-h-screen transition-all duration-300 relative z-10",
          collapsed ? "lg:pl-[74px]" : "lg:pl-72"
        )}
      >
        {/* Top Header - Glassmorphism */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 shadow-sm shadow-slate-950/5 backdrop-blur-xl transition-all dark:border-white/10 dark:bg-[#070b13]/80 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
              aria-label="Menüyü aç"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground select-none">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Yönetim Paneli</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{title}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="flex items-center gap-1.5 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full text-xs font-bold select-none border border-emerald-500/20 dark:border-emerald-500/10 shadow-sm shadow-emerald-500/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktif
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1600px] p-4 lg:p-8">
          {/* Glowing Premium Header Banner */}
          {!hideHeaderBanner && (
            <div className="relative mb-8 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/15 to-pink-600/15 p-6 shadow-xl shadow-violet-950/10 backdrop-blur-xl dark:border-white/5 md:p-8">
              {/* Decorative Grid Overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60" />

              {/* Glow blobs */}
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Content Wrapper */}
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start md:items-center gap-4">
                  {/* Icon Box */}
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/25 flex-shrink-0">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-[10px] sm:text-xs font-semibold backdrop-blur-sm">
                        <Sparkles className="h-3 w-3" />
                        Yönetim Paneli
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                      <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                        {title}
                      </span>
                    </h2>
                    {description && (
                      <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        {description}
                      </p>
                    )}
                    {/* Last Updated */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Son güncelleme: <LiveClock /></span>
                    </div>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                  {/* Status Pill */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400 backdrop-blur-sm shadow-sm select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                    </span>
                    Çevrimiçi
                  </div>

                  {/* Settings Button */}
                  <button
                    onClick={() => onTabChange('settings')}
                    className="bg-card border border-border hover:border-primary/30 hover:bg-primary/5 text-foreground rounded-xl min-h-11 px-4 py-1.5 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95 outline-none"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Ayarlar</span>
                  </button>

                  {/* Refresh Button */}
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-card border border-border hover:border-primary/30 hover:bg-primary/5 text-foreground rounded-xl -m-1.5 flex h-11 w-11 items-center justify-center transition-all shadow-sm active:scale-95 outline-none"
                    title="Yenile"
                  >
                    <RotateCw className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Render Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
