import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminStats } from '@/components/admin/AdminStats';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { DreamManagement } from '@/components/admin/DreamManagement';
import { CommentManagement } from '@/components/admin/CommentManagement';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { MessageManagement } from '@/components/admin/MessageManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { StatisticsDashboard } from '@/components/admin/StatisticsDashboard';
import { SiteSettings } from '@/components/admin/SiteSettingsPanel';
import { SearchAnalytics } from '@/components/admin/SearchAnalytics';
import { BlogManagement } from '@/components/admin/BlogManagement';
import { BlogCategoryManagement } from '@/components/admin/BlogCategoryManagement';
import { BlogCommentManagement } from '@/components/admin/BlogCommentManagement';
import { AuditLog } from '@/components/admin/AuditLog';
import { AdvancedDashboard } from '@/components/admin/AdvancedDashboard';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { SubscriberManagement } from '@/components/admin/SubscriberManagement';
import { BulkImportExport } from '@/components/admin/BulkImportExport';
import { BulkSEOGenerator } from '@/components/admin/BulkSEOGenerator';
import { NotificationManagement } from '@/components/admin/NotificationManagement';
import { 
  BookOpen, 
  FolderOpen, 
  MessageSquare, 
  TrendingUp,
  ArrowUpRight,
  Clock,
  FileText,
  Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const tabTitles: Record<string, { title: string; description: string }> = {
  overview: { title: 'Genel Bakış', description: 'Site istatistikleri ve son aktiviteler' },
  notifications: { title: 'Bildirimler', description: 'Admin panel bildirimlerini yönetin' },
  dreams: { title: 'Rüya Tabirleri', description: 'Rüya içeriklerini yönetin' },
  categories: { title: 'Kategoriler', description: 'Kategori yapısını düzenleyin' },
  comments: { title: 'Yorumlar', description: 'Kullanıcı yorumlarını yönetin' },
  blog: { title: 'Blog Yazıları', description: 'Blog içeriklerini yönetin' },
  'blog-categories': { title: 'Blog Kategorileri', description: 'Blog kategori yapısını düzenleyin' },
  'blog-comments': { title: 'Blog Yorumları', description: 'Blog yorumlarını yönetin' },
  messages: { title: 'Mesajlar', description: 'İletişim formundan gelen mesajlar' },
  subscribers: { title: 'Aboneler', description: 'Bülten abonelerini yönetin' },
  users: { title: 'Kullanıcılar', description: 'Kullanıcı hesaplarını yönetin' },
  stats: { title: 'İstatistikler', description: 'Detaylı site analizleri' },
  dashboard: { title: 'Gelişmiş Dashboard', description: 'KPI kartları ve trend grafikleri' },
  analytics: { title: 'Arama Analitiği', description: 'En çok aranan kelimeler ve trendler' },
  media: { title: 'Medya Kütüphanesi', description: 'Görsel ve dosya yönetimi' },
  'import-export': { title: 'İçe/Dışa Aktar', description: 'Toplu içerik aktarımı' },
  'bulk-seo': { title: 'Toplu SEO', description: 'AI ile toplu meta veri oluşturma' },
  'audit-log': { title: 'Aktivite Geçmişi', description: 'Tüm admin işlemlerinin kaydı' },
  settings: { title: 'Ayarlar', description: 'Site ayarlarını yapılandırın' },
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');

  const currentTab = tabTitles[activeTab] || tabTitles.overview;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent onNavigate={setActiveTab} />;
      case 'notifications':
        return <NotificationManagement />;
      case 'dreams':
        return <DreamManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'comments':
        return <CommentManagement />;
      case 'blog':
        return <BlogManagement />;
      case 'blog-categories':
        return <BlogCategoryManagement />;
      case 'blog-comments':
        return <BlogCommentManagement />;
      case 'messages':
        return <MessageManagement />;
      case 'subscribers':
        return <SubscriberManagement />;
      case 'users':
        return <UserManagement />;
      case 'stats':
        return <StatisticsDashboard />;
      case 'dashboard':
        return <AdvancedDashboard />;
      case 'analytics':
        return <SearchAnalytics />;
      case 'media':
        return <MediaLibrary />;
      case 'import-export':
        return <BulkImportExport />;
      case 'bulk-seo':
        return <BulkSEOGenerator />;
      case 'audit-log':
        return <AuditLog />;
      case 'settings':
        return <SiteSettings />;
      default:
        return <OverviewContent onNavigate={setActiveTab} />;
    }
  };

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      title={currentTab.title}
      description={currentTab.description}
    >
      {renderContent()}
    </AdminLayout>
  );
}

function OverviewContent({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const quickActions = [
    { tab: 'dreams', label: 'Yeni Rüya Tabiri', desc: 'Veritabanına yeni içerik ekle', icon: BookOpen, color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100/50', borderColor: 'border-blue-100', hoverBg: 'hover:from-blue-100' },
    { tab: 'categories', label: 'Kategori Yönetimi', desc: 'Kategori ekle veya düzenle', icon: FolderOpen, color: 'from-purple-500 to-purple-600', bgColor: 'from-purple-50 to-purple-100/50', borderColor: 'border-purple-100', hoverBg: 'hover:from-purple-100' },
    { tab: 'blog', label: 'Blog Yazısı', desc: 'Yeni blog içeriği oluştur', icon: FileText, color: 'from-orange-500 to-orange-600', bgColor: 'from-orange-50 to-orange-100/50', borderColor: 'border-orange-100', hoverBg: 'hover:from-orange-100' },
    { tab: 'blog-categories', label: 'Blog Kategorisi', desc: 'Blog kategorisi ekle', icon: FolderOpen, color: 'from-pink-500 to-pink-600', bgColor: 'from-pink-50 to-pink-100/50', borderColor: 'border-pink-100', hoverBg: 'hover:from-pink-100' },
    { tab: 'comments', label: 'Yorum İncele', desc: 'Bekleyen yorumları onayla', icon: MessageSquare, color: 'from-emerald-500 to-emerald-600', bgColor: 'from-emerald-50 to-emerald-100/50', borderColor: 'border-emerald-100', hoverBg: 'hover:from-emerald-100' },
    { tab: 'users', label: 'Kullanıcılar', desc: 'Kullanıcı hesaplarını yönet', icon: Users, color: 'from-cyan-500 to-cyan-600', bgColor: 'from-cyan-50 to-cyan-100/50', borderColor: 'border-cyan-100', hoverBg: 'hover:from-cyan-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <AdminStats />

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quick Actions - Glassmorphism */}
        <div className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-200/50 p-6 shadow-lg shadow-slate-200/50">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/10 to-rose-500/10 rounded-full blur-xl" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Hızlı İşlemler</h3>
                  <p className="text-sm text-slate-500">Yaygın admin görevleri</p>
                </div>
              </div>
            </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.tab}
                onClick={() => onNavigate(action.tab)}
                className={`group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${action.bgColor} ${action.hoverBg} border ${action.borderColor} transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold text-sm block">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.desc}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Recent Activity - Glassmorphism */}
        <div className="relative overflow-hidden rounded-2xl bg-white/60 backdrop-blur-xl border border-slate-200/50 p-6 shadow-lg shadow-slate-200/50">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/10 to-sky-500/10 rounded-full blur-xl" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Son Aktiviteler</h3>
                  <p className="text-sm text-slate-500">Platform aktiviteleri</p>
                </div>
              </div>
            </div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
