import { useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  FolderOpen, 
  MessageSquare, 
  TrendingUp,
  ArrowUpRight,
  Clock,
  FileText,
  Users,
  Zap,
  BarChart3,
  Calendar,
  Megaphone,
  Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';

// Lazy load admin components
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminStats = lazy(() => import('@/components/admin/AdminStats').then(m => ({ default: m.AdminStats })));
const CategoryManagement = lazy(() => import('@/components/admin/CategoryManagement').then(m => ({ default: m.CategoryManagement })));
const DreamManagement = lazy(() => import('@/components/admin/DreamManagement').then(m => ({ default: m.DreamManagement })));
const CommentManagement = lazy(() => import('@/components/admin/CommentManagement').then(m => ({ default: m.CommentManagement })));
const RecentActivity = lazy(() => import('@/components/admin/RecentActivity').then(m => ({ default: m.RecentActivity })));
const MessageManagement = lazy(() => import('@/components/admin/MessageManagement').then(m => ({ default: m.MessageManagement })));
const UserManagement = lazy(() => import('@/components/admin/UserManagement').then(m => ({ default: m.UserManagement })));
const StatisticsDashboard = lazy(() => import('@/components/admin/StatisticsDashboard').then(m => ({ default: m.StatisticsDashboard })));
const SiteSettings = lazy(() => import('@/components/admin/SiteSettingsPanel').then(m => ({ default: m.SiteSettings })));
const SearchAnalytics = lazy(() => import('@/components/admin/SearchAnalytics').then(m => ({ default: m.SearchAnalytics })));
const BlogManagement = lazy(() => import('@/components/admin/BlogManagement').then(m => ({ default: m.BlogManagement })));
const BlogCategoryManagement = lazy(() => import('@/components/admin/BlogCategoryManagement').then(m => ({ default: m.BlogCategoryManagement })));
const BlogCommentManagement = lazy(() => import('@/components/admin/BlogCommentManagement').then(m => ({ default: m.BlogCommentManagement })));
const AuditLog = lazy(() => import('@/components/admin/AuditLog').then(m => ({ default: m.AuditLog })));
const AdvancedDashboard = lazy(() => import('@/components/admin/AdvancedDashboard').then(m => ({ default: m.AdvancedDashboard })));
const MediaLibrary = lazy(() => import('@/components/admin/MediaLibrary').then(m => ({ default: m.MediaLibrary })));
const SubscriberManagement = lazy(() => import('@/components/admin/SubscriberManagement').then(m => ({ default: m.SubscriberManagement })));
const BulkImportExport = lazy(() => import('@/components/admin/BulkImportExport').then(m => ({ default: m.BulkImportExport })));
const BulkSEOGenerator = lazy(() => import('@/components/admin/BulkSEOGenerator').then(m => ({ default: m.BulkSEOGenerator })));
const NotificationManagement = lazy(() => import('@/components/admin/NotificationManagement').then(m => ({ default: m.NotificationManagement })));
const ContentCalendar = lazy(() => import('@/components/admin/ContentCalendar').then(m => ({ default: m.ContentCalendar })));
const AdManagement = lazy(() => import('@/components/admin/AdManagement').then(m => ({ default: m.AdManagement })));

const tabTitles: Record<string, { title: string; description: string }> = {
  overview: { title: 'Genel Bakış', description: 'Site istatistikleri ve son aktiviteler' },
  notifications: { title: 'Bildirimler', description: 'Admin panel bildirimlerini yönetin' },
  dreams: { title: 'Rüya Tabirleri', description: 'Rüya içeriklerini yönetin' },
  categories: { title: 'Kategoriler', description: 'Kategori yapısını düzenleyin' },
  comments: { title: 'Yorumlar', description: 'Kullanıcı yorumlarını yönetin' },
  blog: { title: 'Blog Yazıları', description: 'Blog içeriklerini yönetin' },
  'blog-categories': { title: 'Blog Kategorileri', description: 'Blog kategorilerini düzenleyin' },
  'blog-comments': { title: 'Blog Yorumları', description: 'Blog yorumlarını yönetin' },
  messages: { title: 'İletişim Mesajları', description: 'Gelen mesajları görüntüleyin' },
  subscribers: { title: 'Aboneler', description: 'E-posta aboneliklerini yönetin' },
  users: { title: 'Kullanıcılar', description: 'Kullanıcı hesaplarını yönetin' },
  stats: { title: 'İstatistikler', description: 'Detaylı istatistikleri görüntüleyin' },
  dashboard: { title: 'Gelişmiş Panel', description: 'Gelişmiş analiz ve kontroller' },
  analytics: { title: 'Arama Analitik', description: 'Arama verilerini analiz edin' },
  media: { title: 'Medya Kütüphanesi', description: 'Görseller ve dosyaları yönetin' },
  'import-export': { title: 'İçe/Dışa Aktar', description: 'Toplu veri işlemleri' },
  'bulk-seo': { title: 'Toplu SEO', description: 'Toplu SEO optimizasyonu' },
  'audit-log': { title: 'Denetim Günlüğü', description: 'Sistem aktivitelerini izleyin' },
  'content-calendar': { title: 'İçerik Takvimi', description: 'İçerik planlaması yapın' },
  ads: { title: 'Reklam Yönetimi', description: 'Reklamları yönetin ve analiz edin' },
  settings: { title: 'Ayarlar', description: 'Site ayarlarını yapılandırın' },
};

const quickActions = [
  { tab: 'dreams', label: 'Yeni Rüya Tabiri', desc: 'Veritabanına yeni içerik ekle', icon: BookOpen, color: 'from-blue-500 to-blue-600', bgColor: 'from-blue-50 to-blue-100/50', borderColor: 'border-blue-100', hoverBg: 'hover:from-blue-100' },
  { tab: 'categories', label: 'Kategori Yönetimi', desc: 'Kategori ekle veya düzenle', icon: FolderOpen, color: 'from-purple-500 to-purple-600', bgColor: 'from-purple-50 to-purple-100/50', borderColor: 'border-purple-100', hoverBg: 'hover:from-purple-100' },
  { tab: 'blog', label: 'Blog Yazısı', desc: 'Yeni blog içeriği oluştur', icon: FileText, color: 'from-orange-500 to-orange-600', bgColor: 'from-orange-50 to-orange-100/50', borderColor: 'border-orange-100', hoverBg: 'hover:from-orange-100' },
  { tab: 'blog-categories', label: 'Blog Kategorisi', desc: 'Blog kategorisi ekle', icon: FolderOpen, color: 'from-pink-500 to-pink-600', bgColor: 'from-pink-50 to-pink-100/50', borderColor: 'border-pink-100', hoverBg: 'hover:from-pink-100' },
  { tab: 'comments', label: 'Yorum İncele', desc: 'Bekleyen yorumları onayla', icon: MessageSquare, color: 'from-emerald-500 to-emerald-600', bgColor: 'from-emerald-50 to-emerald-100/50', borderColor: 'border-emerald-100', hoverBg: 'hover:from-emerald-100' },
  { tab: 'users', label: 'Kullanıcılar', desc: 'Kullanıcı hesaplarını yönet', icon: Users, color: 'from-cyan-500 to-cyan-600', bgColor: 'from-cyan-50 to-cyan-100/50', borderColor: 'border-cyan-100', hoverBg: 'hover:from-cyan-100' },
];

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const currentTab = tabTitles[activeTab] || tabTitles.overview;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent onNavigate={setActiveTab} />;
      case 'notifications':
        return <Suspense fallback={<LoadingFallback />}><NotificationManagement /></Suspense>;
      case 'dreams':
        return <Suspense fallback={<LoadingFallback />}><DreamManagement /></Suspense>;
      case 'categories':
        return <Suspense fallback={<LoadingFallback />}><CategoryManagement /></Suspense>;
      case 'comments':
        return <Suspense fallback={<LoadingFallback />}><CommentManagement /></Suspense>;
      case 'blog':
        return <Suspense fallback={<LoadingFallback />}><BlogManagement /></Suspense>;
      case 'blog-categories':
        return <Suspense fallback={<LoadingFallback />}><BlogCategoryManagement /></Suspense>;
      case 'blog-comments':
        return <Suspense fallback={<LoadingFallback />}><BlogCommentManagement /></Suspense>;
      case 'messages':
        return <Suspense fallback={<LoadingFallback />}><MessageManagement /></Suspense>;
      case 'subscribers':
        return <Suspense fallback={<LoadingFallback />}><SubscriberManagement /></Suspense>;
      case 'users':
        return <Suspense fallback={<LoadingFallback />}><UserManagement /></Suspense>;
      case 'stats':
        return <Suspense fallback={<LoadingFallback />}><StatisticsDashboard /></Suspense>;
      case 'dashboard':
        return <Suspense fallback={<LoadingFallback />}><AdvancedDashboard /></Suspense>;
      case 'analytics':
        return <Suspense fallback={<LoadingFallback />}><SearchAnalytics /></Suspense>;
      case 'media':
        return <Suspense fallback={<LoadingFallback />}><MediaLibrary /></Suspense>;
      case 'import-export':
        return <Suspense fallback={<LoadingFallback />}><BulkImportExport /></Suspense>;
      case 'bulk-seo':
        return <Suspense fallback={<LoadingFallback />}><BulkSEOGenerator /></Suspense>;
      case 'audit-log':
        return <Suspense fallback={<LoadingFallback />}><AuditLog /></Suspense>;
      case 'content-calendar':
        return <Suspense fallback={<LoadingFallback />}><ContentCalendar /></Suspense>;
      case 'ads':
        return <Suspense fallback={<LoadingFallback />}><AdManagement /></Suspense>;
      case 'settings':
        return <Suspense fallback={<LoadingFallback />}><SiteSettings /></Suspense>;
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
  return (
    <div className="space-y-8">
      <Suspense fallback={<LoadingFallback />}>
        <AdminStats />
      </Suspense>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Quick Actions - Premium Card */}
        <motion.div 
          className="xl:col-span-2 relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Aurora Background */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-pink-500/10 via-rose-500/5 to-transparent rounded-full blur-2xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <Zap className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hızlı İşlemler</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Yaygın admin görevleri</p>
              </div>
            </div>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.tab}
                  onClick={() => onNavigate(action.tab)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${action.bgColor} ${action.hoverBg} border ${action.borderColor} transition-all duration-200 hover:shadow-lg`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-sm block">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.desc}</span>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Recent Activity - Premium Card */}
        <motion.div 
          className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-xl shadow-slate-200/20 dark:shadow-slate-950/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-teal-500/5 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <motion.div 
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
                whileHover={{ rotate: 5, scale: 1.05 }}
              >
                <Clock className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Son Aktiviteler</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Platform</p>
              </div>
            </div>
            <Suspense fallback={<LoadingFallback />}>
              <RecentActivity />
            </Suspense>
          </div>
        </motion.div>
      </div>

      {/* Additional Quick Stats Row */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {[
          { icon: BarChart3, label: 'İstatistikler', desc: 'Detaylı analiz', tab: 'stats', color: 'from-blue-500 to-cyan-500' },
          { icon: Calendar, label: 'İçerik Takvimi', desc: 'Planlama', tab: 'content-calendar', color: 'from-violet-500 to-purple-500' },
          { icon: Megaphone, label: 'Reklam Yönetimi', desc: 'Kampanyalar', tab: 'ads', color: 'from-orange-500 to-amber-500' },
        ].map((item, i) => (
          <motion.button
            key={item.tab}
            onClick={() => onNavigate(item.tab)}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="group flex items-center gap-4 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/20 dark:shadow-slate-950/20 hover:shadow-xl transition-all duration-300"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-slate-900 dark:text-white block">{item.label}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</span>
            </div>
            <ArrowUpRight className="h-5 w-5 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-all duration-200" />
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}