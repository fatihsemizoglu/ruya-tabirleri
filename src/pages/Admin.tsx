import { useState, lazy, Suspense } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

const UnifiedDashboard = lazy(() => import('@/components/admin/UnifiedDashboard'));
const CategoryManagement = lazy(() => import('@/components/admin/CategoryManagement'));
const DreamManagement = lazy(() => import('@/components/admin/DreamManagement'));
const CommentManagement = lazy(() => import('@/components/admin/CommentManagement'));
const MessageManagement = lazy(() => import('@/components/admin/MessageManagement'));
const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const SiteSettings = lazy(() => import('@/components/admin/SiteSettingsPanel'));
const SearchAnalytics = lazy(() => import('@/components/admin/SearchAnalytics'));
const BlogManagement = lazy(() => import('@/components/admin/BlogManagement'));
const BlogCategoryManagement = lazy(() => import('@/components/admin/BlogCategoryManagement'));
const BlogCommentManagement = lazy(() => import('@/components/admin/BlogCommentManagement'));
const AuditLog = lazy(() => import('@/components/admin/AuditLog'));
const MediaLibrary = lazy(() => import('@/components/admin/MediaLibrary'));
const SubscriberManagement = lazy(() => import('@/components/admin/SubscriberManagement'));
const BulkImportExport = lazy(() => import('@/components/admin/BulkImportExport'));
const AnalyticsDashboard = lazy(() => import('@/components/admin/AnalyticsDashboard'));
const GamificationPanel = lazy(() => import('@/components/admin/GamificationPanel'));
const SubscriberAdvanced = lazy(() => import('@/components/admin/SubscriberAdvanced'));

const tabTitles: Record<string, { title: string; description: string }> = {
  overview: { title: 'Genel Bakış', description: 'Tüm metrikler, grafikler ve son aktiviteler' },
  dreams: { title: 'Rüya Tabirleri', description: 'Rüya içeriklerini yönetin' },
  categories: { title: 'Kategoriler', description: 'Kategori yapısını düzenleyin' },
  comments: { title: 'Yorumlar', description: 'Kullanıcı yorumlarını yönetin' },
  blog: { title: 'Blog Yazıları', description: 'Blog içeriklerini yönetin' },
  'blog-categories': { title: 'Blog Kategorileri', description: 'Blog kategori yapısını düzenleyin' },
  'blog-comments': { title: 'Blog Yorumları', description: 'Blog yorumlarını yönetin' },
  messages: { title: 'Mesajlar', description: 'İletişim formundan gelen mesajlar' },
  subscribers: { title: 'Aboneler', description: 'Bülten abonelerini yönetin' },
  users: { title: 'Kullanıcılar', description: 'Kullanıcı hesaplarını yönetin' },
  dashboard: { title: 'Genel Bakış', description: 'Tüm metrikler, grafikler ve son aktiviteler' },
  analytics: { title: 'Arama Analitiği', description: 'En çok aranan kelimeler ve trendler' },
  media: { title: 'Medya Kütüphanesi', description: 'Görsel ve dosya yönetimi' },
  'import-export': { title: 'İçe/Dışa Aktar', description: 'Toplu içerik aktarımı' },
  'audit-log': { title: 'Aktivite Geçmişi', description: 'Tüm admin işlemlerinin kaydı' },
  'analytics-dashboard': { title: 'Gelişmiş Analitik', description: 'İçerik ROI, arama niyeti ve segmentasyon' },
  'gamification': { title: 'Gamification', description: 'Rozetler, seviyeler, liderlik ve churn tahmini' },
  'subscribers-advanced': { title: 'Gelişmiş Abone Yönetimi', description: 'Drip kampanyalar ve abone yaşam döngüsü' },
  settings: { title: 'Ayarlar', description: 'Site ayarlarını yapılandırın' },
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');

  const currentTab = tabTitles[activeTab] || tabTitles.overview;

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
      case 'dashboard':
        return <UnifiedDashboard onNavigate={setActiveTab} />;
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
      case 'analytics':
        return <SearchAnalytics />;
      case 'media':
        return <MediaLibrary />;
      case 'import-export':
        return <BulkImportExport />;
      case 'audit-log':
        return <AuditLog />;
      case 'analytics-dashboard':
        return <AnalyticsDashboard />;
      case 'gamification':
        return <GamificationPanel />;
      case 'subscribers-advanced':
        return <SubscriberAdvanced />;
      case 'settings':
        return <SiteSettings />;
      default:
        return <UnifiedDashboard onNavigate={setActiveTab} />;
    }
  };

  const pagesWithCustomHeader = [
    'blog', 'dreams', 'categories', 'blog-categories',
    'comments', 'blog-comments', 'messages', 'subscribers',
    'users'
  ];

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={currentTab.title}
      description={currentTab.description}
      hideHeaderBanner={pagesWithCustomHeader.includes(activeTab)}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      }>
        {renderContent()}
      </Suspense>
    </AdminLayout>
  );
}

