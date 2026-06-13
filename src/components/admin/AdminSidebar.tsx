import { Link } from 'react-router-dom';
import {
  LayoutDashboard, 
  BookOpen, 
  FolderOpen, 
  MessageSquare, 
  MessageCircle,
  Settings,
  Users,
  Mail,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Search,
  FileText,
  Tag,
  History,
  Image,
  UserPlus,
  ArrowUpDown,
  BarChart3,
  Trophy,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tab: string;
  colorClass: string;
  bgClass: string;
}

const mainNavItems: NavItem[] = [
  { 
    title: 'Dashboard', 
    subtitle: 'Genel bakış', 
    icon: LayoutDashboard, 
    tab: 'overview',
    colorClass: 'text-blue-500 dark:text-blue-400',
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/15'
  },
  { 
    title: 'Rüya Tabirleri', 
    subtitle: 'Rüya içerikleri', 
    icon: BookOpen, 
    tab: 'dreams',
    colorClass: 'text-purple-500 dark:text-purple-400',
    bgClass: 'bg-purple-500/10 dark:bg-purple-500/15'
  },
  { 
    title: 'Kategoriler', 
    subtitle: 'Rüya kategorileri', 
    icon: FolderOpen, 
    tab: 'categories',
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15'
  },
  { 
    title: 'Yorumlar', 
    subtitle: 'Kullanıcı yorumları', 
    icon: MessageSquare, 
    tab: 'comments',
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15'
  },
];

const blogNavItems: NavItem[] = [
  { 
    title: 'Blog Yazıları', 
    subtitle: 'Blog içerikleri', 
    icon: FileText, 
    tab: 'blog',
    colorClass: 'text-sky-500 dark:text-sky-400',
    bgClass: 'bg-sky-500/10 dark:bg-sky-500/15'
  },
  { 
    title: 'Blog Kategorileri', 
    subtitle: 'Kategori düzeni', 
    icon: Tag, 
    tab: 'blog-categories',
    colorClass: 'text-cyan-500 dark:text-cyan-400',
    bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/15'
  },
  { 
    title: 'Blog Yorumları', 
    subtitle: 'Blog yorumları', 
    icon: MessageCircle, 
    tab: 'blog-comments',
    colorClass: 'text-orange-500 dark:text-orange-400',
    bgClass: 'bg-orange-500/10 dark:bg-orange-500/15'
  },
];

const secondaryNavItems: NavItem[] = [
  { 
    title: 'Mesajlar', 
    subtitle: 'Gelen mesajlar', 
    icon: Mail, 
    tab: 'messages',
    colorClass: 'text-rose-500 dark:text-rose-400',
    bgClass: 'bg-rose-500/10 dark:bg-rose-500/15'
  },
  { 
    title: 'Aboneler', 
    subtitle: 'Bülten aboneleri', 
    icon: UserPlus, 
    tab: 'subscribers',
    colorClass: 'text-teal-500 dark:text-teal-400',
    bgClass: 'bg-teal-500/10 dark:bg-teal-500/15'
  },
  { 
    title: 'Kullanıcılar', 
    subtitle: 'Kullanıcı hesapları', 
    icon: Users, 
    tab: 'users',
    colorClass: 'text-indigo-500 dark:text-indigo-400',
    bgClass: 'bg-indigo-500/10 dark:bg-indigo-500/15'
  },
  {
    title: 'Arama Analitiği',
    subtitle: 'Arama trendleri',
    icon: Search,
    tab: 'analytics',
    colorClass: 'text-yellow-500 dark:text-yellow-400',
    bgClass: 'bg-yellow-500/10 dark:bg-yellow-500/15'
  },
  {
    title: 'Gelişmiş Analitik',
    subtitle: 'ROI, Niyet, Segment',
    icon: BarChart3,
    tab: 'analytics-dashboard',
    colorClass: 'text-violet-500 dark:text-violet-400',
    bgClass: 'bg-violet-500/10 dark:bg-violet-500/15'
  },
  { 
    title: 'Gamification', 
    subtitle: 'Rozet, seviye, churn', 
    icon: Trophy, 
    tab: 'gamification',
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgClass: 'bg-amber-500/10 dark:bg-amber-500/15'
  },
  {
    title: 'Abone Yönetimi+',
    subtitle: 'Drip kampanyalar',
    icon: Mail,
    tab: 'subscribers-advanced',
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15'
  },
  {
    title: 'A/B Testler',
    subtitle: 'Test & analiz',
    icon: FlaskConical,
    tab: 'ab-tests',
    colorClass: 'text-pink-500 dark:text-pink-400',
    bgClass: 'bg-pink-500/10 dark:bg-pink-500/15'
  },
  { 
    title: 'Medya', 
    subtitle: 'Görsel kütüphanesi', 
    icon: Image, 
    tab: 'media',
    colorClass: 'text-pink-500 dark:text-pink-400',
    bgClass: 'bg-pink-500/10 dark:bg-pink-500/15'
  },
  {
    title: 'İçe/Dışa Aktar',
    subtitle: 'Veri transferi',
    icon: ArrowUpDown,
    tab: 'import-export',
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/15'
  },
  {
    title: 'Aktivite Geçmişi',
    subtitle: 'İşlem kayıtları', 
    icon: History, 
    tab: 'audit-log',
    colorClass: 'text-slate-500 dark:text-slate-400',
    bgClass: 'bg-slate-500/10 dark:bg-slate-500/15'
  },
  { 
    title: 'Ayarlar', 
    subtitle: 'Sistem ayarları', 
    icon: Settings, 
    tab: 'settings',
    colorClass: 'text-zinc-500 dark:text-zinc-400',
    bgClass: 'bg-zinc-500/10 dark:bg-zinc-500/15'
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminSidebar({ activeTab, onTabChange, collapsed, onCollapsedChange }: AdminSidebarProps) {
  const { profile, signOut } = useAuth();

  const renderNavButton = (item: NavItem) => {
    const isActive = activeTab === item.tab;
    return (
      <button
        key={item.tab}
        onClick={() => onTabChange(item.tab)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 group outline-none",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0",
            isActive 
              ? "bg-white/20 text-white" 
              : cn(item.bgClass, item.colorClass)
          )}>
            <item.icon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className={cn(
                "text-[13px] font-bold tracking-wide truncate",
                isActive ? "text-white" : "text-slate-100"
              )}>
                {item.title}
              </span>
              <span className={cn(
                "text-[11px] truncate mt-0.5",
                isActive ? "text-indigo-100/80" : "text-slate-400/80"
              )}>
                {item.subtitle}
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <ChevronRight className={cn(
            "h-4 w-4 transition-all duration-200",
            isActive 
              ? "text-white/80 opacity-100 translate-x-0" 
              : "text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
          )} />
        )}
      </button>
    );
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#0b0f19] border-r border-slate-800/40 text-white transition-all duration-300 flex flex-col shadow-xl shadow-black/30",
        collapsed ? "w-[70px]" : "w-[260px]"
      )}
    >
      {/* Logo Area */}
      <div className={cn(
        "flex items-center gap-3 px-4 h-16 border-b border-slate-800/40",
        collapsed && "justify-center px-2"
      )}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <Moon className="h-5 w-5 text-white animate-float" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-bold text-base leading-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Rüya Tabirleri</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto bg-[#0b0f19] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-[#0b0f19]">
        <div className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3", collapsed && "text-center px-0")}>
          {!collapsed ? "MENÜ" : "•"}
        </div>
        {mainNavItems.map(renderNavButton)}

        <div className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-3", collapsed && "text-center px-0")}>
          {!collapsed ? "BLOG" : "•"}
        </div>
        {blogNavItems.map(renderNavButton)}

        <div className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-3", collapsed && "text-center px-0")}>
          {!collapsed ? "YÖNETİM" : "•"}
        </div>
        {secondaryNavItems.map(renderNavButton)}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-slate-800/50 p-3 space-y-1.5 bg-[#090d16]">
        {/* Back to Site */}
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group text-slate-300 hover:bg-white/5 hover:text-white",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800/50 text-slate-400 group-hover:bg-slate-800 group-hover:text-white transition-all flex-shrink-0">
            <Home className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-slate-200">Siteye Git</span>
              <span className="text-[11px] text-slate-550 truncate mt-0.5">Ana sayfaya dön</span>
            </div>
          )}
        </Link>

        {/* User Info */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/20 rounded-xl border border-slate-800/30">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-indigo-500/10">
              {profile?.full_name?.charAt(0) || profile?.username?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-200">{profile?.full_name || profile?.username || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 font-medium">Yönetici</p>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={signOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group text-red-400 hover:bg-red-500/10 hover:text-red-300",
            collapsed && "justify-center px-2"
          )}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500 group-hover:bg-red-500/20 transition-all flex-shrink-0">
            <LogOut className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold text-red-400 group-hover:text-red-300">Çıkış Yap</span>
              <span className="text-[11px] text-red-550/70 truncate mt-0.5">Oturumu kapat</span>
            </div>
          )}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors",
            collapsed && "justify-center px-2"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-xs font-medium">Daralt</span>}
        </button>
      </div>
    </aside>
  );
}

