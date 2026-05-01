import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  BookOpen, 
  FolderOpen, 
  MessageSquare, 
  Settings,
  Users,
  BarChart3,
  Mail,
  FileText,
  Tag,
  MessagesSquare,
  Search,
  Image,
  UserPlus,
  ArrowUpDown,
  Sparkles,
  History,
  LayoutGrid,
  ChevronLeft,
  LogOut,
  Home,
  Bell,
  Zap,
  Moon,
  ChevronRight,
  Calendar,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tab?: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Ana Menü',
    items: [
      { title: 'Genel Bakış', icon: LayoutDashboard, tab: 'overview' },
      { title: 'Rüya Tabirleri', icon: BookOpen, tab: 'dreams' },
      { title: 'Kategoriler', icon: FolderOpen, tab: 'categories' },
      { title: 'Yorumlar', icon: MessageSquare, tab: 'comments' },
    ],
  },
  {
    title: 'Blog',
    items: [
      { title: 'Blog Yazıları', icon: FileText, tab: 'blog' },
      { title: 'Blog Kategorileri', icon: Tag, tab: 'blog-categories' },
      { title: 'Blog Yorumları', icon: MessagesSquare, tab: 'blog-comments' },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { title: 'Bildirimler', icon: Bell, tab: 'notifications' },
      { title: 'Mesajlar', icon: Mail, tab: 'messages' },
      { title: 'Aboneler', icon: UserPlus, tab: 'subscribers' },
      { title: 'Kullanıcılar', icon: Users, tab: 'users' },
      { title: 'İstatistikler', icon: BarChart3, tab: 'stats' },
    ],
  },
  {
    title: 'Gelişmiş',
    items: [
      { title: 'Dashboard', icon: LayoutGrid, tab: 'dashboard' },
      { title: 'Analitik', icon: Search, tab: 'analytics' },
      { title: 'Medya', icon: Image, tab: 'media' },
      { title: 'İçerik Takvimi', icon: Calendar, tab: 'content-calendar' },
      { title: 'Reklam Yönetimi', icon: Megaphone, tab: 'ads' },
      { title: 'İçe/Dışa Aktar', icon: ArrowUpDown, tab: 'import-export' },
      { title: 'Toplu SEO', icon: Sparkles, tab: 'bulk-seo' },
      { title: 'Aktivite', icon: History, tab: 'audit-log' },
      { title: 'Ayarlar', icon: Settings, tab: 'settings' },
    ],
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
  const location = useLocation();

  const getIconColor = (tab: string) => {
    const colors: Record<string, string> = {
      overview: 'text-blue-500',
      dreams: 'text-blue-500',
      categories: 'text-violet-500',
      comments: 'text-emerald-500',
      blog: 'text-orange-500',
      'blog-categories': 'text-pink-500',
      'blog-comments': 'text-rose-500',
      notifications: 'text-amber-500',
      messages: 'text-sky-500',
      subscribers: 'text-green-500',
      users: 'text-cyan-500',
      stats: 'text-lime-500',
      dashboard: 'text-fuchsia-500',
      analytics: 'text-blue-500',
      media: 'text-teal-500',
      'import-export': 'text-green-500',
      'bulk-seo': 'text-purple-500',
      'audit-log': 'text-gray-500',
      settings: 'text-neutral-500',
    };
    return colors[tab] || 'text-gray-500';
  };

  const getBgColor = (tab: string, isActive: boolean) => {
    if (!isActive) return 'transparent';
    
    // TailAdmin uses blue-50 for all active items
    return 'bg-blue-50 dark:bg-blue-500/10';
  };

  return (
    <aside 
      className={cn(
        "h-full backdrop-blur-2xl bg-white/80 dark:bg-slate-950/80 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-all duration-500 ease-out shadow-2xl shadow-slate-200/20 dark:shadow-slate-950/50",
        collapsed ? "w-[90px]" : "w-[290px]"
      )}
    >
      {/* Logo with Aurora Glow */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3 relative">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30"
              whileHover={{ rotate: 5, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Moon className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <span className="font-bold text-lg text-gradient-animated">
                Rüya
              </span>
              <span className="text-sm text-slate-400 dark:text-slate-500 ml-1">Admin</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30"
            whileHover={{ rotate: 5, scale: 1.05 }}
          >
            <Moon className="h-5 w-5 text-white" />
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative",
            collapsed && "hidden"
          )}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Collapse Toggle (when collapsed) */}
      {collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center my-3"
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => onCollapsedChange(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={cn("px-3", groupIndex > 0 && "mt-5")}>
            {!collapsed && (
              <motion.h3 
                className="px-3 mb-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                {group.title}
              </motion.h3>
            )}
            <nav className="space-y-0.5">
              {group.items.map((item, itemIndex) => {
                const isActive = activeTab === item.tab;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.tab}
                    onClick={() => item.tab && onTabChange(item.tab)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.05 + itemIndex * 0.03 }}
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 relative overflow-hidden",
                      collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                      isActive 
                        ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/5 dark:from-indigo-500/15 dark:to-purple-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    {isActive && (
                      <motion.div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
                        layoutId="activeIndicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={cn(
                      "shrink-0 transition-colors duration-200",
                      collapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
                      isActive ? getIconColor(item.tab || '') : "text-slate-400 dark:text-slate-500"
                    )} />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                    {isActive && !collapsed && (
                      <motion.div 
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        ))}
      </ScrollArea>

      {/* Footer with Glass Effect */}
      <div className="p-3 border-t border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
        <Link 
          to="/"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition-all duration-200",
            collapsed && "justify-center px-3"
          )}
          title={collapsed ? "Siteye Dön" : undefined}
        >
          <Home className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-[18px] w-[18px]")} />
          {!collapsed && <span>Siteye Dön</span>}
        </Link>
        <motion.button
          onClick={() => signOut()}
          whileHover={{ x: collapsed ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-all duration-200 mt-1",
            collapsed && "justify-center px-3"
          )}
          title={collapsed ? "Çıkış Yap" : undefined}
        >
          <LogOut className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-[18px] w-[18px]")} />
          {!collapsed && <span>Çıkış Yap</span>}
        </motion.button>
      </div>
    </aside>
  );
}
