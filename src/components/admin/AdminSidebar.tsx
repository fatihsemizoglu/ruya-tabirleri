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
        "h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300",
        collapsed ? "w-[90px]" : "w-[290px]"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
              <Moon className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                Rüya
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">Admin</span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center mx-auto">
            <Moon className="h-5 w-5 text-white" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 rounded-lg",
            collapsed && "hidden"
          )}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Collapse Toggle (when collapsed) */}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 mx-auto my-3 rounded-lg"
          onClick={() => onCollapsedChange(false)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={cn("px-3", groupIndex > 0 && "mt-5")}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeTab === item.tab;
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => item.tab && onTabChange(item.tab)}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200",
                      collapsed ? "justify-center px-3 py-3" : "px-3 py-2.5",
                      isActive 
                        ? cn(getBgColor(item.tab || '', true), "text-blue-600 dark:text-blue-400") 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                    )}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon className={cn(
                      "shrink-0",
                      collapsed ? "h-6 w-6" : "h-5 w-5",
                      isActive ? getIconColor(item.tab || '') : "text-gray-500 dark:text-gray-400"
                    )} />
                    {!collapsed && (
                      <span className="truncate">{item.title}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <Link 
          to="/"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors",
            collapsed && "justify-center px-3"
          )}
          title={collapsed ? "Siteye Dön" : undefined}
        >
          <Home className={cn("shrink-0", collapsed ? "h-6 w-6" : "h-5 w-5")} />
          {!collapsed && <span>Siteye Dön</span>}
        </Link>
        <button
          onClick={() => signOut()}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-1",
            collapsed && "justify-center px-3"
          )}
          title={collapsed ? "Çıkış Yap" : undefined}
        >
          <LogOut className={cn("shrink-0", collapsed ? "h-6 w-6" : "h-5 w-5")} />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
