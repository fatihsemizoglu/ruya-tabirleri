/**
 * Turkish (Türkçe) Translation Constants
 * 
 * This file contains all UI text strings in Turkish.
 * Used throughout the application instead of i18n.
 */

export const translations = {
  common: {
    loading: "Yükleniyor...",
    save: "Kaydet",
    cancel: "İptal",
    delete: "Sil",
    edit: "Düzenle",
    create: "Oluştur",
    search: "Ara",
    close: "Kapat",
    confirm: "Onayla",
    yes: "Evet",
    no: "Hayır",
    actions: "İşlemler",
    active: "Aktif",
    inactive: "Pasif",
    all: "Tümü",
    yes_delete: "Evet, Sil",
    error: "Hata",
    success: "Başarılı",
    warning: "Uyarı",
    and: "ve",
    siteName: "Rüya Tabirleri",
    defaultDescription: "Binlerce rüya tabiri arasında arama yapın. İslami ve psikolojik yorumlarla rüyalarınızın anlamını keşfedin."
  },
  nav: {
    dashboard: "Gösterge Paneli",
    dreams: "Rüyalar",
    categories: "Kategoriler",
    comments: "Yorumlar",
    blog: "Blog",
    blogCategories: "Blog Kategorileri",
    blogComments: "Blog Yorumları",
    messages: "Mesajlar",
    subscribers: "Aboneler",
    users: "Kullanıcılar",
    analytics: "Analitik",
    media: "Medya Kütüphanesi",
    importExport: "İçe/Dışa Aktar",
    auditLog: "İşlem Geçmişi",
    settings: "Ayarlar"
  },
  admin: {
    title: "Yönetim Paneli",
    loading: "Yükleniyor...",
    accessDenied: "Erişim Engellendi",
    accessDeniedMessage: "Bu sayfaya erişim yetkiniz bulunmuyor. {{role}} yetkisi gereklidir.",
    backToHome: "Ana Sayfaya Dön",
    active: "Aktif",
    online: "Çevrimiçi",
    settings: "Ayarlar",
    refresh: "Yenile",
    lastUpdate: "Son güncelleme",
    errorTitle: "Bir Şeyler Yanlış Gitti",
    errorMessage: "Beklenmeyen bir hata oluştu.",
    errorRefresh: "Sayfayı Yenile",
    moderatorRole: "Moderatör veya admin",
    adminRole: "Admin"
  }
} as const;

// Export helper function for template literals
export const t = (key: string, replacements?: Record<string, string | number>) => {
  const value = key.split('.').reduce<unknown>((obj, k) => (obj as Record<string, unknown>)?.[k], translations);
  
  if (typeof value === 'string' && replacements) {
    return Object.entries(replacements).reduce(
      (str, [key, val]) => str.replace(`{{${key}}}`, String(val)),
      value
    );
  }
  
  return (value as string) || key;
};
