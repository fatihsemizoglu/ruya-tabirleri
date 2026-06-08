import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UnifiedDashboard } from '@/components/admin/UnifiedDashboard';
import { CategoryManagement } from '@/components/admin/CategoryManagement';
import { DreamManagement } from '@/components/admin/DreamManagement';
import { CommentManagement } from '@/components/admin/CommentManagement';
import { MessageManagement } from '@/components/admin/MessageManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { SiteSettings } from '@/components/admin/SiteSettingsPanel';
import { SearchAnalytics } from '@/components/admin/SearchAnalytics';
import { BlogManagement } from '@/components/admin/BlogManagement';
import { BlogCategoryManagement } from '@/components/admin/BlogCategoryManagement';
import { BlogCommentManagement } from '@/components/admin/BlogCommentManagement';
import { AuditLog } from '@/components/admin/AuditLog';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import { SubscriberManagement } from '@/components/admin/SubscriberManagement';
import { BulkImportExport } from '@/components/admin/BulkImportExport';

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
      {renderContent()}
    </AdminLayout>
  );
}

